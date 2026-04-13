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
    
    # 0. COVER
    book_content.append({
        "chapter": 0,
        "isChapterStart": True,
        "title": "COVER",
        "content": "<div class='cover-wrapper'><img src='src/assets/images/cover.jpg' alt='Beneath Manado Cover' class='book-cover-fullscreen'></div>"
    })

    # Preamble (Page 1)
    if parts[0].strip():
        book_content.append({
            "chapter": 1,
            "isChapterStart": True,
            "title": "Beneath Manado (Intro)",
            "content": parts[0].strip()
        })

    paras_per_page = 10

    for i, part_content in enumerate(parts[1:]):
        ch_num = i + 1
        ch_title = markers[i][2]
        
        # Split by <p> tag
        paras = re.findall(r'<p>.*?</p>', part_content, re.DOTALL)
        if not paras:
            # Fallback for non-p tagged content if any
            paras = [part_content]

        # Chunk paragraphs
        chunks = [paras[x:x+paras_per_page] for x in range(0, len(paras), paras_per_page)]
        
        for j, chunk in enumerate(chunks):
            page_title = f"{ch_title} ({j+1}/{len(chunks)})"
            page_content = "".join(chunk)
            
            book_content.append({
                "chapter": ch_num,
                "isChapterStart": (j == 0),
                "title": page_title if len(chunks) > 1 else ch_title,
                "content": page_content
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
