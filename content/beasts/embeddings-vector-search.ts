import type { DiscoveredBeast } from "@/lib/beasts";

export const embeddingsVectorSearch: DiscoveredBeast = {
  slug: "embeddings-vector-search",
  number: 6,
  status: "discovered",
  name: { en: "Embeddings & Vector Search", es: "Embeddings y búsqueda vectorial" },
  habitat: "ai",
  ecosystem: { en: "LLM apps and pgvector", es: "Apps con LLM y pgvector" },
  danger: 3,
  // Written by Claude from the sources below and approved by the author.
  draft: false,
  sheet: {
    en: {
      tagline: "Meaning turned into coordinates, so that finding similar text becomes finding nearby points.",
      behavior: [
        "An embedding model reads a text and returns a vector: a fixed-length list of numbers, often hundreds or thousands long. The model is trained so that texts with similar meaning get vectors that point in similar directions. \"How do I reset my password?\" and \"I forgot my login\" end up close together, even though they share almost no words.",
        "Vector search uses that geometry. Each document is embedded once and stored with its vector, for example in a PostgreSQL column with pgvector. At search time, the query is embedded with the same model, and the database ranks the stored vectors by how close they are to it, usually by cosine similarity, and returns the top k.",
        "Comparing the query with every stored vector is exact, but slow once there are millions. Approximate nearest neighbor indexes such as HNSW and IVFFlat check only a promising part of the collection. They answer much faster and occasionally miss a true neighbor; that trade of recall for speed is tuned with the index parameters.",
        "This is the retrieval step of RAG: a question is embedded, the closest passages are found, and they are given to a language model as context. The search knows nothing about truth or relevance, only distance, so the quality of the answer depends on how the documents were split and on what counts as close enough.",
      ],
      dangers: [
        {
          title: "Top k always returns something",
          body: "A nearest-neighbor query returns k results even when nothing in the collection is related. Without a similarity threshold, a question with no good answer still gets the least bad passages, and a language model will build an answer on them.",
        },
        {
          title: "Vectors from different models do not mix",
          body: "Each model defines its own space. A query embedded with one model cannot be compared with documents embedded with another, or even with a different version of the same model. Changing models means embedding the whole collection again.",
        },
        {
          title: "Similar is not the same as correct",
          body: "Embeddings capture topic and phrasing more than facts. \"The refund takes 5 days\" and \"The refund takes 30 days\" are very close vectors. Exact terms such as IDs, names or error codes are often better served by keyword search, alone or combined with vectors.",
        },
        {
          title: "How the text is split matters",
          body: "Long documents are cut into chunks before embedding. Chunks too large blur several topics into one vector; chunks too small lose the context that gives them meaning. Chunk size and overlap change the results more than most other settings.",
        },
      ],
      sightings: ["The PIA Gestión assistant had to answer questions like \"which contracts allow pets?\", and the clauses never used that word: they said \"domestic animals\". Searching by exact text found nothing. Searching by meaning, with embeddings of each clause and the nearest neighbors of the question, found them."],
    },
    es: {
      tagline: "El significado convertido en coordenadas, para que encontrar texto parecido sea encontrar puntos cercanos.",
      behavior: [
        "Un modelo de embeddings lee un texto y devuelve un vector: una lista de números de largo fijo, muchas veces de cientos o miles de valores. El modelo está entrenado para que textos de significado parecido obtengan vectores que apuntan en direcciones parecidas. «¿Cómo restablezco mi contraseña?» y «Olvidé mi acceso» quedan cerca, aunque casi no comparten palabras.",
        "La búsqueda vectorial aprovecha esa geometría. Cada documento se convierte en embedding una sola vez y se guarda con su vector, por ejemplo en una columna de PostgreSQL con pgvector. Al buscar, la consulta se convierte en embedding con el mismo modelo, y la base de datos ordena los vectores guardados según su cercanía, en general por cosine similarity, y devuelve los top k.",
        "Comparar la consulta con cada vector guardado es exacto, pero lento cuando hay millones. Los índices de vecinos más cercanos aproximados, como HNSW e IVFFlat, revisan solo una parte prometedora de la colección. Responden mucho más rápido y a veces se pierden un vecino real; ese intercambio de recall por velocidad se ajusta con los parámetros del índice.",
        "Este es el paso de recuperación de RAG: la pregunta se convierte en embedding, se buscan los pasajes más cercanos y se le pasan a un modelo de lenguaje como contexto. La búsqueda no sabe nada de verdad ni de relevancia, solo de distancia, así que la calidad de la respuesta depende de cómo se dividieron los documentos y de qué se considera lo bastante cerca.",
      ],
      dangers: [
        {
          title: "Top k siempre devuelve algo",
          body: "Una búsqueda de vecinos más cercanos devuelve k resultados aunque nada en la colección tenga relación. Sin un threshold de similitud, una pregunta sin buena respuesta igual recibe los pasajes menos malos, y un modelo de lenguaje arma una respuesta sobre ellos.",
        },
        {
          title: "Los vectores de modelos distintos no se mezclan",
          body: "Cada modelo define su propio espacio. Una consulta convertida con un modelo no se puede comparar con documentos convertidos con otro, ni siquiera con otra versión del mismo modelo. Cambiar de modelo implica volver a convertir toda la colección.",
        },
        {
          title: "Parecido no es lo mismo que correcto",
          body: "Los embeddings capturan el tema y la forma de decir algo más que los hechos. «El reembolso tarda 5 días» y «El reembolso tarda 30 días» son vectores muy cercanos. Los términos exactos, como IDs, nombres o códigos de error, suelen resolverse mejor con búsqueda por palabras clave, sola o combinada con vectores.",
        },
        {
          title: "Cómo se divide el texto importa",
          body: "Los documentos largos se cortan en fragmentos (chunks) antes de convertirlos. Fragmentos demasiado grandes mezclan varios temas en un solo vector; fragmentos demasiado chicos pierden el contexto que les da sentido. El tamaño y la superposición de los fragmentos cambian los resultados más que casi cualquier otro ajuste.",
        },
      ],
      sightings: ["El asistente de PIA Gestión tenía que responder preguntas como \"¿qué contratos permiten mascotas?\", y las cláusulas nunca usaban esa palabra: decían \"animales domésticos\". Buscar por texto exacto no encontraba nada. Buscar por significado, con embeddings de cada cláusula y los vecinos más cercanos de la pregunta, sí."],
    },
  },
  sources: [
    {
      title: "OpenAI: Vector embeddings",
      url: "https://platform.openai.com/docs/guides/embeddings",
    },
    {
      title: "Anthropic: Embeddings",
      url: "https://docs.anthropic.com/en/docs/build-with-claude/embeddings",
    },
    {
      title: "pgvector: Open-source vector similarity search for Postgres",
      url: "https://github.com/pgvector/pgvector",
    },
    {
      title: "Supabase: Vector columns",
      url: "https://supabase.com/docs/guides/ai/vector-columns",
    },
    {
      title: "Malkov and Yashunin: Efficient and robust approximate nearest neighbor search using HNSW graphs",
      url: "https://arxiv.org/abs/1603.09320",
    },
    {
      title: "SBERT: Semantic search",
      url: "https://www.sbert.net/examples/sentence_transformer/applications/semantic-search/README.html",
    },
  ],
};
