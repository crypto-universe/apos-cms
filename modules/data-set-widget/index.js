// Data Set Widget - для отображения datasets на страницах

module.exports = {
  extend: '@apostrophecms/widget-type',

  options: {
    label: 'Data Set Visualization',
    icon: 'chart-bar-icon'
  },

  fields: {
    add: {
      datasetId: {
        type: 'string',
        label: 'Dataset ID',
        required: true,
        help: 'ID dataset для отображения'
      },
      visualizationType: {
        type: 'select',
        label: 'Visualization Type',
        required: true,
        choices: [
          { label: 'Table', value: 'table' },
          { label: 'Bar Chart', value: 'bar' },
          { label: 'Line Chart', value: 'line' },
          { label: 'Pie Chart', value: 'pie' },
          { label: 'Map', value: 'map' }
        ],
        def: 'table'
      },
      maxRows: {
        type: 'integer',
        label: 'Max Rows to Display',
        def: 50,
        min: 1,
        max: 500
      },
      showFilters: {
        type: 'boolean',
        label: 'Show Filters',
        def: true
      },
      showSearch: {
        type: 'boolean',
        label: 'Show Search',
        def: true
      },
      showPagination: {
        type: 'boolean',
        label: 'Show Pagination',
        def: true
      },
      // For charts
      chartXAxis: {
        type: 'string',
        label: 'Chart X Axis Field',
        if: {
          visualizationType: ['bar', 'line']
        }
      },
      chartYAxis: {
        type: 'string',
        label: 'Chart Y Axis Field',
        if: {
          visualizationType: ['bar', 'line', 'pie']
        }
      },
      chartTitle: {
        type: 'string',
        label: 'Chart Title'
      },
      // For map
      mapLatField: {
        type: 'string',
        label: 'Latitude Field',
        if: {
          visualizationType: 'map'
        }
      },
      mapLonField: {
        type: 'string',
        label: 'Longitude Field',
        if: {
          visualizationType: 'map'
        }
      },
      mapLabelField: {
        type: 'string',
        label: 'Map Marker Label Field',
        if: {
          visualizationType: 'map'
        }
      }
    }
  },

  methods(self) {
    return {
      async load(req, widgets) {
        // Загрузить данные для каждого widget
        for (const widget of widgets) {
          try {
            const datasetId = widget.datasetId;
            if (!datasetId) continue;

            // Получить dataset
            const dataset = await self.apos.modules['data-set'].getDataset(datasetId);
            if (!dataset) continue;

            widget._dataset = dataset;

            // Получить records
            const result = await self.apos.modules['data-set'].getRecords(datasetId, {
              page: 1,
              limit: widget.maxRows || 50
            });

            widget._records = result.records;
            widget._pagination = result.pagination;

          } catch (error) {
            console.error('Error loading dataset for widget:', error);
            widget._error = error.message;
          }
        }
      }
    };
  }
};
