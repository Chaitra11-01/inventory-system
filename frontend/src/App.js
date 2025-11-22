import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Modal from "react-modal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

Modal.setAppElement("#root");

function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [history, setHistory] = useState([]);
  const [historyModal, setHistoryModal] = useState(false);
  const [importFile, setImportFile] = useState(null);

  // Add New Product Modal
  const [addModal, setAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    unit: "",
    category: "",
    brand: "",
    stock: 0,
    image: ""
  });

  const API = "https://inventory-backend-mc57.onrender.com/api/products";

  // ---------- FETCH PRODUCTS ----------
  const fetchProducts = useCallback(async () => {
    try {
      const url = search ? `${API}/search?name=${search}` : API;
      const res = await axios.get(url);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ---------- INLINE EDIT SAVE ----------
  const handleSave = async (id) => {
    try {
      await axios.put(`${API}/${id}`, editData);
      toast.success("Product updated!");
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      toast.error("Update failed");
      console.error(err);
    }
  };

  // ---------- VIEW INVENTORY HISTORY ----------
  const viewHistory = async (id) => {
    try {
      const res = await axios.get(`${API}/${id}/history`);
      setHistory(res.data);
      setHistoryModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------- IMPORT CSV ----------
  const handleImport = async () => {
    if (!importFile) return toast.error("Select a CSV file");
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      const res = await axios.post(`${API}/import`, formData);
      toast.success(`Added: ${res.data.added}, Skipped: ${res.data.skipped}`);
      setImportFile(null);
      fetchProducts();
    } catch (err) {
      toast.error("Import failed");
    }
  };

  // ---------- EXPORT CSV ----------
  const handleExport = () => {
    window.open(`${API}/export`);
  };

  // ---------- DELETE PRODUCT ----------
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      toast.success("Product deleted!");
      fetchProducts();
    } catch (err) {
      toast.error("Delete failed");
      console.error(err);
    }
  };

  // Unique categories for filter
  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div className="container">
      <h1>Product Inventory</h1>

      {/* ---------- CONTROLS ---------- */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setImportFile(e.target.files[0])}
        />
        <button onClick={handleImport}>Import CSV</button>
        <button onClick={handleExport}>Export CSV</button>
        <button onClick={() => setAddModal(true)}>Add New Product</button>
      </div>

      {/* ---------- PRODUCTS TABLE ---------- */}
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Unit</th>
            <th>Category</th>
            <th>Brand</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products
            .filter((p) => !category || p.category === category)
            .map((p) => (
              <tr key={p.id}>
                <td data-label="Image">{p.image && <img src={p.image} alt={p.name} />}</td>
                <td data-label="Name">
                  {editingId === p.id ? (
                    <input
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                    />
                  ) : (
                    p.name
                  )}
                </td>
                <td data-label="Unit">
                  {editingId === p.id ? (
                    <input
                      value={editData.unit}
                      onChange={(e) =>
                        setEditData({ ...editData, unit: e.target.value })
                      }
                    />
                  ) : (
                    p.unit
                  )}
                </td>
                <td data-label="Category">{p.category}</td>
                <td data-label="Brand">{p.brand}</td>
                <td data-label="Stock">
                  {editingId === p.id ? (
                    <input
                      type="number"
                      value={editData.stock}
                      onChange={(e) =>
                        setEditData({ ...editData, stock: e.target.value })
                      }
                    />
                  ) : (
                    p.stock
                  )}
                </td>
                <td data-label="Status" style={{ color: p.stock > 0 ? "green" : "red" }}>
                  {p.stock > 0 ? "In Stock" : "Out of Stock"}
                </td>
                <td data-label="Actions">
                  {editingId === p.id ? (
                    <>
                      <button onClick={() => handleSave(p.id)}>Save</button>
                      <button onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(p.id); setEditData(p) }}>Edit</button>
                      <button onClick={() => viewHistory(p.id)}>History</button>
                      <button onClick={() => handleDelete(p.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* ---------- INVENTORY HISTORY MODAL ---------- */}
      <Modal
        isOpen={historyModal}
        onRequestClose={() => setHistoryModal(false)}
        contentLabel="Inventory History"
      >
        <h2>Inventory History</h2>
        <button onClick={() => setHistoryModal(false)}>Close</button>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Old Stock</th>
              <th>New Stock</th>
              <th>Changed By</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id}>
                <td>{new Date(h.timestamp).toLocaleString()}</td>
                <td>{h.oldStock}</td>
                <td>{h.newStock}</td>
                <td>{h.changedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* ---------- ADD NEW PRODUCT MODAL ---------- */}
      <Modal
        isOpen={addModal}
        onRequestClose={() => setAddModal(false)}
        contentLabel="Add New Product"
      >
        <h2>Add New Product</h2>
        <button onClick={() => setAddModal(false)}>Close</button>
        <div className="modal-form">
          <input
            type="text"
            placeholder="Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Unit"
            value={newProduct.unit}
            onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
          />
          <input
            type="text"
            placeholder="Category"
            value={newProduct.category}
            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
          />
          <input
            type="text"
            placeholder="Brand"
            value={newProduct.brand}
            onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
          />
          <input
            type="number"
            placeholder="Stock"
            value={newProduct.stock}
            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
          />
          <input
            type="text"
            placeholder="Image URL"
            value={newProduct.image}
            onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
          />
          <button onClick={async () => {
            try {
              await axios.post(API, newProduct);
              toast.success("Product added!");
              setAddModal(false);
              setNewProduct({ name:"", unit:"", category:"", brand:"", stock:0, image:"" });
              fetchProducts();
            } catch (err) {
              toast.error("Failed to add product");
              console.error(err);
            }
          }}>Add Product</button>
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}

export default App;
