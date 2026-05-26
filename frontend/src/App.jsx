import { useState, useEffect } from "react";

const API_URL = "/api/products";

/**
 * Builds a URLSearchParams query string for the product list endpoint.
 *
 * @param {Object} params
 * @param {number} params.page     - Current page number.
 * @param {number} params.limit    - Items per page.
 * @param {string} params.category - Category filter (empty string means all).
 * @param {string} params.sort     - Sort field: "createdAt" | "price" | "name".
 * @param {string} params.order    - Sort direction: "asc" | "desc".
 * @returns {string} Encoded query string.
 */
function buildQuery({ page, limit, category, sort, order }) {
  const q = new URLSearchParams({ page, limit, sort, order });
  if (category) q.set("category", category);
  return q.toString();
}

/**
 * Fetches a paginated, filtered and sorted product list from the API.
 *
 * @param {Object} params - Same shape as buildQuery params.
 * @returns {Promise<{ data: Array<Object>, pagination: Object }>}
 * @throws {Error} When the server responds with a non-2xx status.
 */
async function fetchProducts(params) {
  const res = await fetch(`${API_URL}?${buildQuery(params)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function App() {
  const [products,   setProducts]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const [page,     setPage]     = useState(1);
  const [limit]                 = useState(20);
  const [category, setCategory] = useState("");
  const [sort,     setSort]     = useState("createdAt");
  const [order,    setOrder]    = useState("desc");

  useEffect(() => {
    setPage(1);
  }, [category, sort, order]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchProducts({ page, limit, category, sort, order })
      .then(({ data, pagination }) => {
        if (!cancelled) {
          setProducts(data);
          setPagination(pagination);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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
                <div key={product._id} className="product-card">
                  <span className="category">{product.category}</span>
                  <h2>{product.name}</h2>
                  <p className="description">{product.description}</p>
                  <div className="card-footer">
                    <span className="price">{product.price.toFixed(2)} EUR</span>
                    <span className="stock">{product.stock} en stock</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pagination && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Precedent
              </button>
              <span className="page-info">
                Page {pagination.page} / {pagination.totalPages}
                &nbsp;({pagination.total} resultats)
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
