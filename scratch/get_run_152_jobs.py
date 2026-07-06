import requests
import json

token = "ghp_n07DqU28zGjU0B9Qexs1yLclC6Jd8L0dZ5Qx"  # Or we can read it from git config if any
# Let's try calling GitHub API to list jobs for run 28793228039
url = "https://api.github.com/repos/ahmadzyamm21/tiktok-revenue-analyzer/actions/runs/28793228039/jobs"
headers = {"Accept": "application/vnd.github.v3+json"}
r = requests.get(url, headers=headers)
if r.status_code == 200:
    jobs = r.json().get('jobs', [])
    for j in jobs:
        print(f"Job: {j['name']}, Status: {j['status']}, Conclusion: {j['conclusion']}")
        if j['conclusion'] == 'failure':
            print("Steps:")
            for s in j.get('steps', []):
                print(f"  Step: {s['name']}, Status: {s['status']}, Conclusion: {s['conclusion']}")
else:
    print(f"Failed to fetch jobs: {r.status_code} - {r.text}")
