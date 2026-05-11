import { useState, useEffect } from "react";

const API_URL = "/api/products";

export default function App() {
  // Ces informations ne sont pas forcément nécessaires, vous pouvez les adapter à votre convenance
  const [products,   setProducts]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const [page,     setPage]     = useState(1);
  const [limit]                 = useState(10);
  const [category, setCategory] = useState("");
  const [sort,     setSort]     = useState("createdAt");
  const [order,    setOrder]    = useState("desc");

  useEffect(() => {
    // a completer...
  }, [page, limit, category, sort, order]);

  return (
    <div className="app">
      <div className="header">
        <h1>Catalogue produits</h1>
        <div className="filters">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Toutes categories</option>
            <option value="shoes">Chaussures</option>
            <option value="clothing">Vetements</option>
            <option value="accessories">Accessoires</option>
            <option value="bags">Sacs</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="createdAt">Date</option>
            <option value="price">Prix</option>
            <option value="name">Nom</option>
          </select>
          <select value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="asc">Croissant</option>
            <option value="desc">Decroissant</option>
          </select>
        </div>
      </div>

      {loading && <p className="loading">Chargement...</p>}
      {error   && <p className="error">Erreur : {error}</p>}

      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <p className="empty">Aucun produit trouve.</p>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <div key={product._id} />
              ))}
            </div>
          )}
          {pagination && (
            <div />
          )}
        </>
      )}
    </div>
  );
}
