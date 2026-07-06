import json

backup_file = r'C:\Users\ahmad\Downloads\testing\tiktok_revenue_hpp_sku_1782753741932.json'
with open(backup_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

print("Keys in backup:")
for k in data.keys():
    print(f"  {k}: type={type(data[k])}, len={len(data[k]) if hasattr(data[k], '__len__') else 'N/A'}")

# Let's inspect some of the logs and settings
if 'logs' in data:
    print("First 3 logs:")
    print(json.dumps(data['logs'][:3], indent=2))
if 'settings' in data:
    print("Settings:")
    print(json.dumps(data['settings'], indent=2))
