import zstandard, json

f = open(r'C:\Users\26503\.dsh\sessions\--C-Users-26503-Documents-deepseek-harness-default-workspace--\session-6e138822-96ae-4745-840c-f8f540d805be\session.v4.jsonl.zstd', 'rb')
out = zstandard.ZstdDecompressor().stream_reader(f, read_across_frames=True).read()
lines = [json.loads(x) for x in out.split(b'\n') if x]

header = None
msgs = []
for l in lines:
    if l.get('seq') == 17:
        header = l.get('data', {}).get('header', {})
    elif l.get('type') == 'user/message':
        content = l.get('data', {}).get('content', [])
        msgs.append({
            'role': 'user',
            'content': content
        })

data = {
    'config': header.get('config', {}),
    'tools': header.get('tools', []),
    'messages': msgs
}

with open(r'C:\Users\26503\.gemini\antigravity\scratch\dsh-tool-antigravity\scripts\exact-options.json', 'w', encoding='utf-8') as out_f:
    json.dump(data, out_f, ensure_ascii=False, indent=2)

print('Extracted successfully, tools:', len(data['tools']), 'msgs:', len(data['messages']))
