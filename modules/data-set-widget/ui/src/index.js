// Data Set Widget - Client-side JavaScript

export default () => {
  apos.util.onReady(() => {
    initializeCharts();
    initializeMaps();
    initializeTableFeatures();
  });
};

function initializeCharts() {
  const chartContainers = document.querySelectorAll('.data-set-chart-container canvas');

  chartContainers.forEach(canvas => {
    const widgetId = canvas.id.replace('chart-', '');
    const data = window.datasetChartData && window.datasetChartData[widgetId];

    if (!data || !window.Chart) return;

    const chartType = canvas.dataset.chartType;
    const xField = data.xField;
    const yField = data.yField;

    // Подготовка данных
    const labels = [];
    const values = [];

    data.records.forEach(record => {
      const xValue = record.data[xField];
      const yValue = record.data[yField];

      if (xValue !== null && xValue !== undefined && yValue !== null && yValue !== undefined) {
        labels.push(String(xValue));
        values.push(parseFloat(yValue) || 0);
      }
    });

    if (labels.length === 0) {
      console.warn('No data for chart');
      return;
    }

    // Настройка для разных типов графиков
    const config = {
      type: chartType,
      data: {
        labels: labels,
        datasets: [{
          label: yField,
          data: values,
          backgroundColor: chartType === 'pie'
            ? generateColors(values.length)
            : 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: chartType === 'line' ? 0.4 : 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: chartType === 'pie',
            position: 'right'
          },
          title: {
            display: false
          }
        },
        scales: chartType !== 'pie' ? {
          y: {
            beginAtZero: true
          }
        } : {}
      }
    };

    new Chart(canvas, config);
  });
}

function generateColors(count) {
  const colors = [
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)',
    'rgba(83, 102, 255, 0.7)',
    'rgba(255, 99, 255, 0.7)',
    'rgba(99, 255, 132, 0.7)'
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}

function initializeMaps() {
  const mapContainers = document.querySelectorAll('.data-set-map-container > div[id^="map-"]');

  mapContainers.forEach(container => {
    const widgetId = container.id.replace('map-', '');
    const data = window.datasetMapData && window.datasetMapData[widgetId];

    if (!data || !window.L) return;

    const latField = data.latField;
    const lonField = data.lonField;
    const labelField = data.labelField;

    // Создание карты
    const map = L.map(container.id).setView([0, 0], 2);

    // Добавление tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Добавление маркеров
    const markers = [];
    data.records.forEach(record => {
      const lat = parseFloat(record.data[latField]);
      const lon = parseFloat(record.data[lonField]);
      const label = record.data[labelField] || 'Location';

      if (!isNaN(lat) && !isNaN(lon)) {
        const marker = L.marker([lat, lon]).addTo(map);
        marker.bindPopup(`<strong>${label}</strong>`);
        markers.push([lat, lon]);
      }
    });

    // Центрирование карты по маркерам
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  });
}

function initializeTableFeatures() {
  // Search functionality
  const searchInputs = document.querySelectorAll('.data-set-search-input');

  searchInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const container = e.target.closest('.data-set-table-container');
      const rows = container.querySelectorAll('tbody tr');

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });

  // Pagination buttons
  const paginationButtons = document.querySelectorAll('.btn-pagination');

  paginationButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const page = parseInt(e.target.dataset.page);
      const widget = e.target.closest('.data-set-widget');
      const datasetId = widget.dataset.datasetId;

      // Загрузить новую страницу через HTMX или fetch
      await loadDatasetPage(datasetId, page, widget);
    });
  });
}

async function loadDatasetPage(datasetId, page, widget) {
  try {
    const response = await fetch(`/api/data-set/${datasetId}/records?page=${page}&limit=50`);
    const data = await response.json();

    // Обновить таблицу (упрощенный вариант)
    console.log('Loaded page', page, data);
    // TODO: Update table DOM with new data

  } catch (error) {
    console.error('Error loading page:', error);
  }
}
