import requests
from collections import defaultdict

HANDLE = "SorahISA"  # 改成你的 Codeforces username
OUTFILE = "output3.md"

# 拉取所有 submission（最多 10000 筆）
resp = requests.get(f"https://codeforces.com/api/user.status?handle={HANDLE}&from=1&count=10000")
submissions = resp.json()["result"]

print("debug", len(submissions))

# 分類 submission
contest_subs = defaultdict(lambda: defaultdict(set))
for sub in submissions:
    if "contestId" not in sub: continue
    if sub["contestId"] < 100000: continue
    cid = sub["contestId"]
    pid = sub["problem"]["index"]
    verdict = sub.get("verdict", "UNKNOWN")
    contest_subs[cid][pid].add(verdict)

print("debug", len(contest_subs))

# 抓 contest 名稱與所有題目列表
def get_contest_info(cid):
    try:
        url = f"https://codeforces.com/api/contest.standings?contestId={cid}&from=1&count=1"
        res = requests.get(url, timeout=10)
        json_data = res.json()
        name = json_data["result"]["contest"]["name"]
        problems = [p["index"] for p in json_data["result"]["problems"]]
        print(cid, name)
        return name, problems
    except:
        return "(group/mashup/unknown)", []

contest_infos = {cid: get_contest_info(cid) for cid in sorted(contest_subs, reverse=True)}

# 輸出 Markdown
with open(OUTFILE, "w", encoding="utf-8") as f:
    all_lengths = [len(info[1]) for info in contest_infos.values()]
    max_pcnt = max(all_lengths, default=0)

    f.write("| Contest | " + " | ".join(f"p{i+1}" for i in range(max_pcnt)) + " |\n")
    f.write("|" + "---|" * (max_pcnt + 1) + "\n")

    for cid in sorted(contest_subs, reverse=True):
        name, all_probs = contest_infos[cid]
        name = name.replace("|", "\\|")
        row = [f"[{cid} - {name}](https://codeforces.com/gym/{cid})"]
        for pid in sorted(all_probs, key=lambda x: (len(x), x)):
            if pid in contest_subs[cid]:
                verdicts = contest_subs[cid][pid]
                if "OK" in verdicts:
                    row.append(f"<b style=\"color:green\">{pid}</b>")
                else:
                    row.append(f"<b style=\"color:red\">{pid}</b>")
            else:
                row.append(pid)
        row += [""] * (max_pcnt - len(row) + 1)
        f.write("| " + " | ".join(row) + " |\n")

print(f"✅ Done. Markdown written to {OUTFILE}")
