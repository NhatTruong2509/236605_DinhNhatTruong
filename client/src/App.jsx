
import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, UtensilsCrossed, RefreshCw } from 'lucide-react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://two36605-dinhnhattruong-api.onrender.com/api/foods';
const emptyFood = {
  foodId: '',
  name: '',
  category: 'Món nước',
  cuisine: 'Việt Nam',
  ingredients: [],
  price: '',
  quantity: '',
  description: '',
  imageUrl: '',
};

function App() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyFood);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadFoods(keyword = search) {
    setLoading(true);
    setError('');
    try {
      const url = `${API_URL}?search=${encodeURIComponent(keyword)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Không tải được danh sách món ăn.');
      const data = await response.json();
      setFoods(data);
    } catch (err) {
      setError('Không kết nối được Backend. Hãy kiểm tra cổng 5000 và cấu hình API.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFoods('');
  }, []);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyFood);
    setShowForm(true);
  }

  function openEditForm(food) {
    setEditingId(food._id);
    setForm({
      ...food,
      ingredients: Array.isArray(food.ingredients)
        ? food.ingredients.join(', ')
        : '',
    });
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const payload = {
      ...form,
      ingredients: typeof form.ingredients === 'string'
        ? form.ingredients.split(',').map(item => item.trim()).filter(Boolean)
        : form.ingredients,
      price: Number(form.price),
      quantity: Number(form.quantity),
    };

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Không thể lưu món ăn.');
      }

      setShowForm(false);
      setForm(emptyFood);
      setEditingId(null);
      await loadFoods();
    } catch (err) {
      setError(err.message || 'Có lỗi khi lưu món ăn.');
    }
  }

  async function handleDelete(food) {
    if (!window.confirm(`Bạn có chắc muốn xóa "${food.name}"?`)) return;

    try {
      const response = await fetch(`${API_URL}/${food._id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Không thể xóa món ăn.');
      await loadFoods();
    } catch (err) {
      setError(err.message || 'Có lỗi khi xóa món ăn.');
    }
  }

  const money = value =>
    Number(value || 0).toLocaleString('vi-VN') + ' ₫';

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon"><UtensilsCrossed size={25} /></span>
          <div>
            <h1>FoodManager</h1>
            <p>HỆ THỐNG QUẢN LÝ MÓN ĂN</p>
          </div>
        </div>
        <span className="student-tag">MSSV: 236605</span>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">QUẢN LÝ NHÀ HÀNG</p>
          <h2>Danh sách món ăn</h2>
          <p className="subtitle">Quản lý thực đơn của bạn một cách dễ dàng.</p>
        </div>
        <button className="primary-btn" onClick={openAddForm}>
          <Plus size={18} /> Thêm món ăn
        </button>
      </section>

      <section className="stats">
        <article className="stat-card">
          <span>Tổng số món ăn</span>
          <strong>{foods.length}</strong>
        </article>
        <article className="stat-card">
          <span>Tổng số lượng</span>
          <strong>{foods.reduce((sum, food) => sum + Number(food.quantity || 0), 0)}</strong>
        </article>
        <article className="stat-card">
          <span>Giá trung bình</span>
          <strong className="price-stat">
            {money(foods.length
              ? foods.reduce((sum, food) => sum + Number(food.price || 0), 0) / foods.length
              : 0)}
          </strong>
        </article>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="menu-panel">
        <div className="panel-heading">
          <div>
            <h3>Thực đơn hiện tại</h3>
            <p>Dữ liệu được tải từ MongoDB Atlas thông qua API.</p>
          </div>
          <button className="icon-btn" onClick={() => loadFoods()} title="Tải lại">
            <RefreshCw size={17} />
          </button>
        </div>

        <form className="search-bar" onSubmit={event => {
          event.preventDefault();
          loadFoods(search);
        }}>
          <Search size={19} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Tìm theo tên, mã món, loại món..."
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        {loading ? (
          <p className="empty-state">Đang tải dữ liệu...</p>
        ) : foods.length === 0 ? (
          <div className="empty-state">Không tìm thấy món ăn nào.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã món</th>
                  <th>Tên món ăn</th>
                  <th>Danh mục</th>
                  <th>Ẩm thực</th>
                  <th>Giá bán</th>
                  <th>Số lượng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {foods.map(food => (
                  <tr key={food._id}>
                    <td><span className="food-id">{food.foodId}</span></td>
                    <td>
                      <div className="food-name">{food.name}</div>
                      <div className="food-description">{food.description}</div>
                    </td>
                    <td><span className="category-tag">{food.category}</span></td>
                    <td>{food.cuisine}</td>
                    <td className="price">{money(food.price)}</td>
                    <td>{food.quantity}</td>
                    <td>
                      <div className="actions">
                        <button className="edit-btn" title="Sửa" onClick={() => openEditForm(food)}>
                          <Pencil size={16} />
                        </button>
                        <button className="delete-btn" title="Xóa" onClick={() => handleDelete(food)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <section className="modal" onClick={event => event.stopPropagation()}>
            <div className="modal-heading">
              <h3>{editingId ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}</h3>
              <button type="button" className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="food-form">
              <label>
                Mã món ăn *
                <input required value={form.foodId} onChange={e => setForm({...form, foodId: e.target.value})} placeholder="FOOD004" />
              </label>
              <label>
                Tên món ăn *
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ví dụ: Bánh mì" />
              </label>
              <div className="form-row">
                <label>
                  Danh mục *
                  <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option>Món nước</option>
                    <option>Món cơm</option>
                    <option>Món ăn nhanh</option>
                    <option>Món tráng miệng</option>
                    <option>Đồ uống</option>
                    <option>Khác</option>
                  </select>
                </label>
                <label>
                  Ẩm thực
                  <input value={form.cuisine} onChange={e => setForm({...form, cuisine: e.target.value})} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Giá bán (VNĐ) *
                  <input required min="0" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </label>
                <label>
                  Số lượng *
                  <input required min="0" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                </label>
              </div>
              <label>
                Nguyên liệu (ngăn cách bằng dấu phẩy)
                <input value={form.ingredients} onChange={e => setForm({...form, ingredients: e.target.value})} placeholder="Thịt, rau, gia vị" />
              </label>
              <label>
                Mô tả
                <textarea rows="2" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </label>
              <label>
                URL hình ảnh
                <input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." />
              </label>
              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="primary-btn">{editingId ? 'Lưu thay đổi' : 'Thêm món ăn'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
