import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function PriceComparison() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [filterEcoFriendly, setFilterEcoFriendly] = useState(false);
  const [sortOption, setSortOption] = useState('priceAsc');

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

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Item", "Vendor", "Price", "Quantity", "Total"];

    const tableRows = cart.map(item => [
      item.name,
      item.vendor,
      `$${item.price.toFixed(2)}`,
      item.quantity,
      `$${(item.price * item.quantity).toFixed(2)}`
    ]);

    // Add Invoice Header
    doc.setFontSize(18);
    doc.text("Keiro Invoice", 14, 22);
    
    // Add Subtitles for Invoice Data
    doc.setFontSize(12);
    doc.text(`Invoice Number: #12345`, 14, 32);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);
    doc.text(`Order Number: ORD-56789`, 14, 44);
    doc.text(`Delivery Number: DEL-98765`, 14, 50);

    // Draw the table with custom styles
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: 'striped',
      styles: {
        halign: 'center',
        valign: 'middle',
        fontSize: 10,
        cellPadding: 4,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: [255, 255, 255],
        fontSize: 12,
      },
    });

    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.08;
    const delivery = 112;
    const discount = (subtotal + delivery) * 0.03;
    const total = calculateTotalCost().toFixed(2);

    // Add summary and totals
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);
    doc.text(`Tax (8%): $${tax.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 16);
    doc.text(`Delivery Fee: $${delivery.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 22);
    doc.text(`Discount (3%): -$${discount.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 28);
    doc.text(`Total: $${total}`, 14, doc.lastAutoTable.finalY + 34);

    // Footer
    doc.setFontSize(10);
    doc.text('Thank you for your order!', 14, doc.lastAutoTable.finalY + 50);

    // Save the PDF
    doc.save("Keiro_Invoice.pdf");
  };

  const groupedProducts = groupByProduct(filteredResults);

  return (
    <div className="container mt-4">
      <div className="text-center mb-4">
        <h1 className="display-4">Keiro</h1>
        <p className="lead">Compare prices and find the best deals across multiple vendors.</p>
      </div>

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

      {/* Export to PDF Button */}
      <div className="text-center mt-5">
        <button onClick={exportToPDF} className="btn btn-success">Export your Order Summary</button>
      </div>
    </div>
  );
}

export default PriceComparison;
