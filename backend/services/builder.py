import docx
import copy
from io import BytesIO

def build_document(filepath: str, selected_ids: list[str]):
    from services.parser import parse_document
    
    tree = parse_document(filepath)
    
    selected_set = set(selected_ids)
    
    nodes_info = {}
    parent_map = {}
    
    def traverse(node, parent_id=None):
        nodes_info[node["id"]] = node
        parent_map[node["id"]] = parent_id
        for child in node.get("children", []):
            traverse(child, node["id"])
            
    for root in tree:
        traverse(root)
        
    indices_to_include = set()
    
    for selected_id in selected_ids:
        if selected_id not in nodes_info:
            continue
            
        node = nodes_info[selected_id]
        indices_to_include.update(range(node["para_index_start"], node["para_index_end"] + 1))
        
        curr_parent_id = parent_map[selected_id]
        while curr_parent_id is not None:
            parent_node = nodes_info[curr_parent_id]
            
            if parent_node["children"]:
                first_child_start = parent_node["children"][0]["para_index_start"]
                indices_to_include.update(range(parent_node["para_index_start"], first_child_start))
            else:
                indices_to_include.update(range(parent_node["para_index_start"], parent_node["para_index_end"] + 1))
                
            curr_parent_id = parent_map[curr_parent_id]
            
    first_heading_start = -1
    if tree:
        first_heading_start = tree[0]["para_index_start"]
    
    doc = docx.Document(filepath)
    doc_elements = list(doc.element.body)

    if first_heading_start > 0:
        indices_to_include.update(range(0, first_heading_start))
    elif first_heading_start == -1:
        indices_to_include.update(range(len(doc_elements)))

    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn

    body = doc.element.body

    # Prima di rimuovere qualsiasi elemento, salviamo tutti i sectPr embedded
    # nei paragrafi che stanno per essere eliminati, spostandoli direttamente nel body.
    # Il sectPr finale (specialmente nell'ultimo paragrafo) contiene i riferimenti
    # a intestazioni, piè di pagina, margini, ecc.
    if first_heading_start != -1:
        for idx, element in enumerate(doc_elements):
            if element.tag.endswith('sectPr'):
                # sectPr già figlio diretto del body: non fare nulla
                continue
            if idx not in indices_to_include:
                # Questo elemento verrà rimosso: salviamo eventuali sectPr annidati
                nested_sect = element.find(qn('w:sectPr'))
                if nested_sect is not None:
                    element.remove(nested_sect)
                    body.append(nested_sect)

    # Ora rimuoviamo gli elementi non inclusi
    # Ricarichiamo la lista poiché potremmo aver modificato il body
    doc_elements_current = list(body)
    for idx, element in enumerate(doc_elements):
        # Manteniamo sempre le impostazioni di sezione per non perdere margini, intestazioni e piè di pagina
        if element.tag.endswith('sectPr'):
            continue

        if first_heading_start != -1 and idx not in indices_to_include:
            parent = element.getparent()
            if parent is not None:
                parent.remove(element)
                
    # Forza l'aggiornamento dei campi (incluso il Sommario) all'apertura in Word
    # in modo che il sommario si auto-generi in base alle sezioni rimaste e ai paragrafi aggiunti
    try:
        settings = doc.settings.element
        update_fields = settings.find(qn('w:updateFields'))
        if update_fields is None:
            update_fields = OxmlElement('w:updateFields')
            update_fields.set(qn('w:val'), 'true')
            settings.append(update_fields)
    except Exception as e:
        print("Impossibile impostare updateFields:", e)
            
    out = BytesIO()
    doc.save(out)
    out.seek(0)
    return out
