import re
import json
import os

def chunk_html(html_file, output_js):
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define Chapter markers
    # <h3>Chapter 1: The Biology of the &quot;Ugly&quot;</h3>
    markers = [
        (1, r'<h3>Chapter 1: The Biology of the &quot;Ugly&quot;</h3>', 'Chapter 1: The Anatomy of Rejection'),
        (2, r'<h3>Chapter 2: The Digital Filter</h3>', 'Chapter 2: The Digital Filter'),
        (3, r'<h3>Chapter 3: The &quot;Identical&quot; Incision</h3>', 'Chapter 3: The \"Identical\" Incision'),
        (4, r'<h3>Chapter 4: Scalpel and Stone</h3>', 'Chapter 4: Scalpel and Stone'),
        (5, r'<h3>Chapter 5: The Silk Harvest</h3>', 'Chapter 5: The Silk Harvest'),
        (6, r'<h3>Chapter 6: The Colonist&#39;s Architecture</h3>', 'Chapter 6: The Colonist\'s Architecture'),
        (7, r'<h3>Chapter 7: The Infection of Acceptance</h3>', 'Chapter 7: The Infection of Acceptance'),
        (8, r'<h3>Chapter 8</h3>', 'Chapter 8: The Final Form'),
        (9, r'<h3>Chapter 9: The Mirror&#39;s Betrayal</h3>', 'Chapter 9: The Mirror\'s Betrayal'),
        (10, r'<h3>Chapter 10: The Last Livestream</h3>', 'Chapter 10: The Last Livestream'),
    ]

    # Add a final marker for the end
    split_regex = '|'.join([m[1] for m in markers])
    parts = re.split(split_regex, content)
    
    # parts[0] is preamble (by Xuan Lin, etc.)
    # parts[1] is Ch 1, etc.
    
    book_content = []
    
    # Load Chinese Translation for Batch 1 (Intro & Chapter 1)
    cn_file_1 = '/Users/decepticonmanager/Book Reader/Content/beneath_manado/zh-CN/chapter_1.html'
    cn_intro = ""
    cn_ch_paras = {1: []}
    if os.path.exists(cn_file_1):
        with open(cn_file_1, 'r', encoding='utf-8') as f:
            cn_full = f.read()
            cn_marker = r'<h3>第一章：“丑陋”的生物学</h3>'
            if cn_marker in cn_full:
                cn_parts = re.split(cn_marker, cn_full)
                cn_intro = cn_parts[0].strip()
                if len(cn_parts) > 1:
                    cn_ch_paras[1] = re.findall(r'<p>.*?</p>', cn_parts[1], re.DOTALL)

    # Load Chinese Translation for all remaining chapters (2-10)
    for ch_num in range(2, 11):
        cn_file = f'/Users/decepticonmanager/Book Reader/Content/beneath_manado/zh-CN/chapter_{ch_num}.html'
        if os.path.exists(cn_file):
            with open(cn_file, 'r', encoding='utf-8') as f:
                cn_full = f.read()
                cn_ch_paras[ch_num] = re.findall(r'<p>.*?</p>', cn_full, re.DOTALL)

    # 0. COVER
    book_content.append({
        "chapter": 0,
        "isChapterStart": True,
        "title": "COVER",
        "title_cn": "封面",
        "content": "<div class='cover-wrapper'><img src='src/assets/images/cover.jpg' alt='Beneath Manado Cover' class='book-cover-fullscreen'></div>",
        "content_cn": "<div class='cover-wrapper'><img src='src/assets/images/cover.jpg' alt='Beneath Manado Cover' class='book-cover-fullscreen'></div>"
    })

    # Preamble (Page 1)
    if parts[0].strip():
        book_content.append({
            "chapter": 1,
            "isChapterStart": True,
            "title": "Beneath Manado (Intro)",
            "title_cn": "美娜多之下 (引言)",
            "content": parts[0].strip(),
            "content_cn": cn_intro if cn_intro else parts[0].strip()
        })

    paras_per_page = 10

    for i, part_content in enumerate(parts[1:]):
        ch_num = i + 1
        ch_title = markers[i][2]
        ch_title_cn = markers[i][2]
        
        # Mapping CN titles
        cn_titles = {
            1: "第一章：“丑陋”的生物学",
            2: "第二章：数字滤镜",
            3: "第三章：“同卵”切口",
            4: "第四章：手术刀与石头",
            5: "第五章：蚕丝收成",
            6: "第六章：领地",
            7: "第七章：脓",
            8: "第八章：一模一样",
            9: "第九章：两半",
            10: "第十章：还款"
        }
        if ch_num in cn_titles:
            ch_title_cn = cn_titles[ch_num]

        # Split by <p> tag
        paras = re.findall(r'<p>.*?</p>', part_content, re.DOTALL)
        
        # Split CN paras
        current_cn_paras = cn_ch_paras.get(ch_num, [])

        # Chunk EN paragraphs into pages of paras_per_page
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
            })

    # Write to data.js
    with open(output_js, 'w', encoding='utf-8') as f:
        f.write("// data.js - Chunked version for Beneath Manado\n\n")
        f.write("if (typeof PocketReader === 'undefined') {\n")
        f.write("    var PocketReader = {};\n")
        f.write("}\n\n")
        f.write("PocketReader.bookContent = ")
        f.write(json.dumps(book_content, indent=4))
        f.write(";\n")

if __name__ == "__main__":
    chunk_html('Content/beneath_manado/2026-04-13 12-37-43 beneath-manado.html', 'src/features/reader/data.js')
    print("Regenerated data.js with chunking.")
