import os

sanctum_file = os.path.join('chronicles-vault', 'apps', 'client', 'src', 'routes', 'SanctumHome.tsx')

with open(sanctum_file, 'rb') as fp:
    raw = fp.read()

# Replace all mojibake variations
raw = raw.replace(b'\xc3\xa2\xe2\x82\xac\xe2\x80\x9d', b'-')
raw = raw.replace(b'\xc3\xa2\xe2\x80\x9d\xe2\x82\xac', b'-')
raw = raw.replace(b'\xc3\xa2\xe2\x80\xa0\xe2\x80\x9d', b'<->')
raw = raw.replace(b'\xc3\xa2\xc5\x93\xe2\x80\xa2', b'X')
raw = raw.replace(b'\xc3\xa2\xe2\x82\xac\xc2\xa6', b'...')

# Curly quotes if any
raw = raw.replace(b'\xc3\xa2\xe2\x82\xac\xc5\x93', b'"')
raw = raw.replace(b'\xc3\xa2\xe2\x82\xac\xc2\x9d', b'"')
raw = raw.replace(b'\xc3\xa2\xe2\x82\xac\xcb\x9c', b"'")
raw = raw.replace(b'\xc3\xa2\xe2\x82\xac\xe2\x84\xa2', b"'")

with open(sanctum_file, 'wb') as fp:
    fp.write(raw)

# Scan again
non_ascii_lines = []
for i, line in enumerate(raw.splitlines(), 1):
    if any(b > 127 for b in line):
        non_ascii_lines.append((i, line))

print(f"Remaining non-ASCII lines in SanctumHome.tsx: {len(non_ascii_lines)}")
for i, l in non_ascii_lines:
    print(f"L{i}: {repr(l[:80])}")
