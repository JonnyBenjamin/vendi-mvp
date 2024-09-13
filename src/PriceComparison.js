import React, { useState, useEffect } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-modal';

function PriceComparison() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [filterEcoFriendly, setFilterEcoFriendly] = useState(false);
  const [sortOption, setSortOption] = useState('priceAsc');
  const [showCart, setShowCart] = useState(false);

  const handleSearch = () => {
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm === '') {
      alert('Please enter a product name.');
      return;
    }

    fetch(`http://localhost:3001/products`)
      .then((response) => response.json())
      .then((data) => {
        let filteredData = data.filter(
          (item) => item.name.toLowerCase() === trimmedSearchTerm.toLowerCase()
        );
        setResults(filteredData);
      })
      .catch((error) => console.error('Error fetching data:', error));
  };

  useEffect(() => {
    let updatedResults = [...results];

    if (filterEcoFriendly) {
      updatedResults = updatedResults.filter((item) => item.ecoFriendly);
    }

    if (sortOption === 'priceAsc') {
      updatedResults = updatedResults.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'priceDesc') {
      updatedResults = updatedResults.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'ratingAsc') {
      updatedResults = updatedResults.sort((a, b) => a.rating - b.rating);
    } else if (sortOption === 'ratingDesc') {
      updatedResults = updatedResults.sort((a, b) => b.rating - a.rating);
    }

    setFilteredResults(updatedResults);
  }, [results, filterEcoFriendly, sortOption]);

  const groupByProduct = (products) => {
    return products.reduce((grouped, product) => {
      if (!grouped[product.name]) {
        grouped[product.name] = [];
      }
      grouped[product.name].push(product);
      return grouped;
    }, {});
  };

  const handleAddToCart = (item) => {
    const quantity = parseInt(prompt('Enter quantity:', 1));
    if (quantity > 0) {
      const newItem = { ...item, quantity };
      setCart((prevCart) => [...prevCart, newItem]);
    } else {
      alert('Invalid quantity.');
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTotalCost = () => {
    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.08; // 8% tax
    const delivery = 112; // $112 delivery fee
    const discount = (subtotal + delivery) * 0.03; // 3% discount

    return subtotal + tax + delivery - discount;
  };

  const groupedProducts = groupByProduct(filteredResults);

  const modalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      width: '400px',
    },
  };

  return (
    <div className="container mt-4">
      <div className="text-center mb-4">
        <h1 className="display-4">Keiro</h1>
        <p className="lead">Compare prices and find the best deals across multiple vendors.</p>
      </div>

      {/* Cart Icon aligned with the search bar */}
      {filteredResults.length > 0 && (
        <div className="cart-icon" style={{ position: 'fixed', right: '20px', top: '120px' }} onClick={() => setShowCart(true)}>
          <FontAwesomeIcon icon={faShoppingCart} size="2x" />
          <span className="cart-count">{cart.length}</span>
        </div>
      )}

      {/* Cart Modal */}
      <Modal isOpen={showCart} onRequestClose={() => setShowCart(false)} style={modalStyles}>
        <h4>Your Cart</h4>
        {cart.length > 0 ? (
          <ul>
            {cart.map((item, index) => (
              <li key={index}>
                {item.name} from {item.vendor} - ${item.price.toFixed(2)} x {item.quantity}
              </li>
            ))}
          </ul>
        ) : (
          <p>Your cart is empty.</p>
        )}
        <p>Subtotal: ${calculateSubtotal().toFixed(2)}</p>
        <p>Tax (8%): ${(calculateSubtotal() * 0.08).toFixed(2)}</p>
        <p>Delivery: $112.00</p>
        <p>Discount (3%): -${((calculateSubtotal() + 112) * 0.03).toFixed(2)}</p>
        <p><strong>Total Cost: ${calculateTotalCost().toFixed(2)}</strong></p>
        <button onClick={() => setShowCart(false)} className="btn btn-secondary">Close</button>
      </Modal>

      {/* Centered Search Bar */}
      <div className="row justify-content-center mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search product"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <button onClick={handleSearch} className="btn btn-primary btn-block">
            Search
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {filteredResults.length > 0 && (
        <div className="filters-section mb-4">
          <div className="form-inline justify-content-center">
            <div className="form-check mr-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="ecoFriendlyCheck"
                checked={filterEcoFriendly}
                onChange={(e) => setFilterEcoFriendly(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="ecoFriendlyCheck">
                Eco-Friendly Only
              </label>
            </div>

            <div className="form-group ml-3">
              <label htmlFor="sortOptions" className="mr-2">
                Sort by:
              </label>
              <select
                className="form-control"
                id="sortOptions"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="ratingAsc">Rating: Low to High</option>
                <option value="ratingDesc">Rating: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Product Results Table */}
      {Object.keys(groupedProducts).length > 0 ? (
        Object.keys(groupedProducts).map((productName) => (
          <div key={productName} className="mb-5">
            <h3>{productName}</h3>
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Price ($)</th>
                  <th>Location</th>
                  <th>Eco-Friendly</th>
                  <th>Rating</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {groupedProducts[productName].map((item) => (
                  <tr key={item.id}>
                    <td>{item.vendor}</td>
                    <td>{item.price.toFixed(2)}</td>
                    <td>{item.location}</td>
                    <td>{item.ecoFriendly ? 'Yes' : 'No'}</td>
                    <td>{item.rating}</td>
                    <td>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="btn btn-sm btn-primary"
                      >
                        Add to Cart
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        <p>No products found matching your search.</p>
      )}
    </div>
  );
}

export default PriceComparison;
