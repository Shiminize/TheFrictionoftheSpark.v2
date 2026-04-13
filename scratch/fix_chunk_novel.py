"""
Patches chunk_novel.py to use proportional CN distribution instead of fixed slices.
Run once, then delete.
"""

path = '/Users/decepticonmanager/Book Reader/scratch/chunk_novel.py'
with open(path, 'r') as f:
    src = f.read()

old = """        # Chunk paragraphs
        chunks = [paras[x:x+paras_per_page] for x in range(0, len(paras), paras_per_page)]
        cn_chunks = [current_cn_paras[x:x+paras_per_page] for x in range(0, len(current_cn_paras), paras_per_page)]
        
        for j, chunk in enumerate(chunks):
            page_title = f"{ch_title} ({j+1}/{len(chunks)})"
            page_title_cn = f"{ch_title_cn} ({j+1}/{len(chunks)})"
            
            page_content = "".join(chunk)
            page_content_cn = "".join(cn_chunks[j]) if j < len(cn_chunks) else ""
            
            book_content.append({
                "chapter": ch_num,
                "isChapterStart": (j == 0),
                "title": page_title if len(chunks) > 1 else ch_title,
                "title_cn": page_title_cn if len(chunks) > 1 else ch_title_cn,
                "content": page_content,
                "content_cn": page_content_cn
            })"""

new = """        # Chunk EN paragraphs into pages of paras_per_page
        chunks = [paras[x:x+paras_per_page] for x in range(0, len(paras), paras_per_page)]
        n_pages = len(chunks)

        # Proportionally distribute CN paragraphs across the same number of EN pages
        # so every page has CN content even when translation has fewer <p> tags
        cn_chunks = []
        if current_cn_paras and n_pages > 0:
            cn_total = len(current_cn_paras)
            for j in range(n_pages):
                start = int(j * cn_total / n_pages)
                end = int((j + 1) * cn_total / n_pages)
                cn_chunks.append(current_cn_paras[start:end])
        else:
            cn_chunks = [[] for _ in range(n_pages)]

        for j, chunk in enumerate(chunks):
            page_title = f"{ch_title} ({j+1}/{n_pages})"
            page_title_cn = f"{ch_title_cn} ({j+1}/{n_pages})"

            page_content = "".join(chunk)
            page_content_cn = "".join(cn_chunks[j]) if cn_chunks[j] else ""

            book_content.append({
                "chapter": ch_num,
                "isChapterStart": (j == 0),
                "title": page_title if n_pages > 1 else ch_title,
                "title_cn": page_title_cn if n_pages > 1 else ch_title_cn,
                "content": page_content,
                "content_cn": page_content_cn
            })"""

assert old in src, "Target string not found — file may have changed."
patched = src.replace(old, new, 1)

with open(path, 'w') as f:
    f.write(patched)

print("✅ chunk_novel.py patched successfully.")
