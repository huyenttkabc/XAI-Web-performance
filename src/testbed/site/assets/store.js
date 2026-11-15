// Script "nền" của cửa hàng: vẽ lưới sản phẩm nhỏ (công việc nhẹ, tất định — chạy lần nào cũng như nhau).
const grid = document.getElementById('product-grid');
const names = ['Scarf', 'Beanie', 'Gloves', 'Socks', 'Coat', 'Boots'];
grid.innerHTML = names.map((n, i) => `<div class="card"><strong>${n}</strong><p>€${19 + i * 10}.00</p></div>`).join('');
document.getElementById('add-to-cart')?.addEventListener('click', () => { document.title = 'Added'; });
