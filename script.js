let carrinhoElem;

const storage = {
  add: (dados) => {
    const ls = JSON.parse(localStorage.getItem('carrinho') || '[]');
    ls.push(dados);
    localStorage.setItem('carrinho', JSON.stringify(ls));
  },
  remove: (index) => {
    const ls = JSON.parse(localStorage.getItem('carrinho') || '[]');
    ls.splice(index, 1);
    localStorage.setItem('carrinho', JSON.stringify(ls));
  },
  clear: () => {
    while (carrinhoElem.firstChild) carrinhoElem.removeChild(carrinhoElem.firstChild);
    localStorage.setItem('carrinho', '[]');
  },
};

const product = {
  list: () => {
    const w = 'computador';
    return fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${w}`, {
      method: 'GET',
      redirect: 'follow',
    });
  },
  get: (id) => fetch(`https://api.mercadolibre.com/items/${id}`, {
    method: 'GET',
    redirect: 'follow',
  }),
};

function getSkuFromProductItem(item) {
  return item.querySelector('span.item__sku').innerText;
}

function cartItemClickListener(event) {
  const index = [].indexOf.call(event.target.parentElement.children, event.target);
  storage.remove(index);
  event.target.parentNode.removeChild(event.target);
  const ls = JSON.parse(localStorage.getItem('carrinho') || '[]');
  const total = ls.reduce((sum, obj) => obj.salePrice + sum, 0);
  document.querySelector('.total-price')
  .textContent = `Preço total: $${(total ? total.toFixed(2) : 0)}`;
}

function createCartItemElement({ sku, name, salePrice }) {
  const li = document.createElement('li');
  li.className = 'cart__item';
  li.innerText = `SKU: ${sku} | NAME: ${name} | PRICE: $${salePrice}`;
  li.addEventListener('click', cartItemClickListener);
  return li;
}

const cart = {
  add: (e) => {
    if (e.target.classList.contains('loading')) return;
    e.target.classList.add('loading');
    e.target.textContent = 'loading...';
    product.get(getSkuFromProductItem(e.target.closest('.item')))
    .then((response) => response.json())
    .then((produto) => {
      const dados = { sku: produto.id, name: produto.title, salePrice: produto.price };
      cart.addElement(dados);
      storage.add(dados);
      cart.calc();

      e.target.classList.remove('loading');
      e.target.textContent = 'Adicionar ao carrinho!';
    })
    .catch((error) => console.log('error', error));
  },
  addElement: (dados) => carrinhoElem.appendChild(createCartItemElement(dados)),
  calc: () => {
    const ls = JSON.parse(localStorage.getItem('carrinho') || '[]');
    const total = ls.reduce((sum, obj) => obj.salePrice + sum, 0);
    document.querySelector('.total-price')
    .textContent = `Preço total: $${(total ? total.toFixed(2) : 0)}`;
  },
  fill: () => {
    const ls = JSON.parse(localStorage.getItem('carrinho') || '[]');
    ls.forEach((el) => {
      cart.addElement({ sku: el.sku, name: el.name, salePrice: el.salePrice });
    });
    cart.calc();
  },
};

function createProductImageElement(imageSource) {
  const img = document.createElement('img');
  img.className = 'item__image';
  img.src = imageSource;
  return img;
}

function createCustomElement(element, className, innerText) {
  const e = document.createElement(element);
  e.className = className;
  e.innerText = innerText;
  return e;
}

function createProductItemElement({ sku, name, image }) {
  const section = document.createElement('section');
  section.className = 'item';

  section.appendChild(createCustomElement('span', 'item__sku', sku));
  section.appendChild(createCustomElement('span', 'item__title', name));
  section.appendChild(createProductImageElement(image));
  const btn = createCustomElement('button', 'item__add', 'Adicionar ao carrinho!');
  btn.onclick = cart.add;
  section.appendChild(btn);

  return section;
}

window.onload = () => {
  carrinhoElem = document.querySelector('ol.cart__items');
  cart.fill();
  document.body.appendChild(createCustomElement('div', 'loading', 'loading...'));
  product.list().then((response) => response.json()).then((produtos) => {
    document.body.removeChild(document.querySelector('body > .loading'));
    const p = produtos.results;
    p.forEach((el) => {
      document.querySelector('section.items')
      .appendChild(
        createProductItemElement({ sku: el.id, name: el.title, image: el.thumbnail }),
      );
    });
  }).catch((error) => console.log('error', error));
  document.querySelector('.empty-cart').onclick = () => {
    storage.clear();
    cart.calc();
  };
};