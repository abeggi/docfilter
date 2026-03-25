import docx

def parse_document(filepath: str):
    doc = docx.Document(filepath)
    
    tree = []
    stack = []
    
    heading_styles = {"Heading 1": 1, "Heading 2": 2, "Heading 3": 3}
    
    body_elements = list(doc.element.body)
    
    for idx, element in enumerate(body_elements):
        if element.tag.endswith('p'):
            para = docx.text.paragraph.Paragraph(element, doc)
            style_name = para.style.name
            
            if style_name in heading_styles:
                level = heading_styles[style_name]
                node_id = f"h{level}_{idx}"
                
                new_node = {
                    "id": node_id,
                    "level": level,
                    "title": para.text.strip(),
                    "para_index_start": idx,
                    "para_index_end": idx,
                    "children": []
                }
                
                while stack and stack[-1]["level"] >= level:
                    popped = stack.pop()
                    popped["para_index_end"] = idx - 1
                
                if stack:
                    stack[-1]["children"].append(new_node)
                else:
                    tree.append(new_node)
                    
                stack.append(new_node)
    
    last_idx = len(body_elements) - 1
    while stack:
        popped = stack.pop()
        popped["para_index_end"] = last_idx
        
    return tree
