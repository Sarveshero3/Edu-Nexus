from langchain_text_splitters import RecursiveCharacterTextSplitter


sample_text = """
Artificial Intelligence is the simulation of human intelligence processes by machines.
AI is used in healthcare, finance, education, and robotics.
Machine learning allows systems to learn from data.
Deep learning uses neural networks.
Natural Language Processing helps machines understand human language.
""" * 40   


def chunk_text(text):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", " ", ""]
    )
    return splitter.split_text(text)


chunks = chunk_text(sample_text)

for i, chunk in enumerate(chunks):
    print(f"\n--- Chunk {i+1} ---\n")
    print(chunk[:300])  # in order to preview the chunks
