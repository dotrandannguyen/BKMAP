import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Cập nhật state để lần render tiếp theo hiển thị UI thay thế
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Có thể log lỗi ra dịch vụ phân tích (ví dụ Sentry) ở đây
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Giao diện thay thế khi có lỗi
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          color: '#343a40'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#dc3545' }}>
            Ối, đã có lỗi xảy ra!
          </h1>
          <p style={{ marginBottom: '2rem', maxWidth: '600px' }}>
            Hệ thống vừa gặp sự cố không mong muốn trong lúc hiển thị giao diện. Bạn vui lòng tải lại trang để tiếp tục.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
