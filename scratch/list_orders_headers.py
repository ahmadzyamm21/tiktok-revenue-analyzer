import openpyxl

orders_file = r'C:\Users\ahmad\Downloads\testing maret\pesanan maret 2026.xlsx'
wb_ord = openpyxl.load_workbook(orders_file)
ws_ord = wb_ord.active
headers_ord = [str(cell.value or '').strip() for cell in ws_ord[1]]
print("Headers in orders file:")
for idx, h in enumerate(headers_ord):
    print(f"  [{idx}] {h}")
wb_ord.close()
