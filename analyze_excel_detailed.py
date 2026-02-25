import pandas as pd

# Read the Excel file
df = pd.read_excel('data/all_member_table.xlsx')

print('=== All Data ===')
print(df.to_string())

print('\n=== Column Names ===')
print(list(df.columns))

print('\n=== Unique Values by Column ===')
for col in df.columns:
    print(f'\n{col}:')
    print(df[col].value_counts())
