import numpy as np

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

class SemanticSearchService:
    _model = None

    @classmethod
    def get_model(cls):
        # Lazy loading: only initialize the model the first time it's needed
        if SentenceTransformer is None:
            raise RuntimeError('sentence_transformers is not installed')
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
    
    @staticmethod
    def get_max_sim(query_vec, item_vectors):
        """
        Calculates MaxSim: returns the highest similarity score 
        among all vectors assigned to an item.
        """
        if not item_vectors:
            return 0.0
        
        q = np.array(query_vec)
        # Calculate cosine similarity for every vector in the list
        scores = []
        for v in item_vectors:
            v_arr = np.array(v)
            sim = np.dot(q, v_arr) / (np.linalg.norm(q) * np.linalg.norm(v_arr))
            scores.append(sim)
            
        return max(scores) if scores else 0.0