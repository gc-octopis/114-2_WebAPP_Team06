import numpy as np
from sentence_transformers import SentenceTransformer

class SemanticSearchService:
    _model = None

    @classmethod
    def get_model(cls):
        # Lazy loading: only initialize the model the first time it's needed
        if cls._model is None:
            cls._model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        return cls._model

    @staticmethod
    def cosine_similarity(v1, v2):
        # Calculate the cosine similarity between two vectors
        v1 = np.array(v1)
        v2 = np.array(v2)
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

    @classmethod
    def encode_query(cls, query_text):
        # Convert the user's text query into a vector array
        model = cls.get_model()
        return model.encode(query_text).tolist()