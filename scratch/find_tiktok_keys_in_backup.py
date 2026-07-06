import json

backup_file = r'C:\Users\ahmad\Downloads\testing\tiktok_revenue_hpp_sku_1782753741932.json'
with open(backup_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

for k in data.keys():
    if 'tiktok' in k:
        print(f"Key: {k}")
        val = data[k]
        if isinstance(val, str):
            try:
                parsed = json.loads(val)
                print(f"  Parsed as JSON, len={len(parsed)}")
            except:
                print(f"  Value (str) preview: {val[:100]}")
        else:
            print(f"  Value type={type(val)}")
