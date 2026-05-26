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
  const [limit,    setLimit]    = useState(10);
  const [category, setCategory] = useState("");
  const [sort,     setSort]     = useState("createdAt");
  const [order,    setOrder]    = useState("desc");

  useEffect(() => {
    setPage(1);
  }, [category, sort, order, limit]);

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
      <header className="header">
        <div className="header-title">
          <h1>Catalogue</h1>
          {pagination && (
            <span className="header-meta">
              {pagination.total.toLocaleString()} references
            </span>
          )}
        </div>
        <div className="controls">
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
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </header>

      <div className="divider" />

      {loading && (
        <div className="state-container">
          <div className="loader" />
        </div>
      )}

      {error && (
        <div className="state-container">
          <p className="state-error">Erreur : {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <div className="state-container">
              <p className="state-empty">Aucun produit trouve.</p>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product, index) => (
                <article
                  key={product._id}
                  className="product-card"
                  style={{ animationDelay: `${index * 22}ms` }}
                >
                  <span className="card-category">{product.category}</span>
                  <h2 className="card-name">{product.name}</h2>
                  <p className="card-description">{product.description}</p>
                  <div className="card-footer">
                    <span className="card-price">
                      {product.price.toFixed(2)}<small> EUR</small>
                    </span>
                    <span className="card-stock">{product.stock} en stock</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <nav className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Page precedente"
              >
                {'←'}
              </button>
              <div className="page-info">
                <span className="page-current">{pagination.page}</span>
                <span className="page-sep">/</span>
                <span className="page-total">{pagination.totalPages}</span>
                <span className="page-count">
                  {pagination.total.toLocaleString()} resultats
                </span>
              </div>
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                aria-label="Page suivante"
              >
                {'→'}
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
