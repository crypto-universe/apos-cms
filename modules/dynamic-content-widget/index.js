// Dynamic Content Widget with HTMX support
module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Dynamic Content (HTMX)',
    icon: 'lightning-bolt-icon'
  },
  fields: {
    add: {
      endpoint: {
        type: 'string',
        label: 'API Endpoint',
        help: 'URL для загрузки динамического контента',
        required: true
      },
      method: {
        type: 'select',
        label: 'HTTP Method',
        choices: [
          { label: 'GET', value: 'get' },
          { label: 'POST', value: 'post' }
        ],
        def: 'get'
      },
      trigger: {
        type: 'select',
        label: 'Load Trigger',
        help: 'Когда загружать контент',
        choices: [
          { label: 'On Page Load', value: 'load' },
          { label: 'On Click', value: 'click' },
          { label: 'On Scroll Into View', value: 'revealed' },
          { label: 'Every N Seconds', value: 'every' }
        ],
        def: 'load'
      },
      pollInterval: {
        type: 'integer',
        label: 'Poll Interval (seconds)',
        help: 'Используется если выбран "Every N Seconds"',
        def: 5,
        min: 1,
        if: {
          trigger: 'every'
        }
      },
      swapStyle: {
        type: 'select',
        label: 'Swap Style',
        help: 'Как вставлять загруженный контент',
        choices: [
          { label: 'innerHTML', value: 'innerHTML' },
          { label: 'outerHTML', value: 'outerHTML' },
          { label: 'beforebegin', value: 'beforebegin' },
          { label: 'afterbegin', value: 'afterbegin' },
          { label: 'beforeend', value: 'beforeend' },
          { label: 'afterend', value: 'afterend' }
        ],
        def: 'innerHTML'
      },
      showLoadingIndicator: {
        type: 'boolean',
        label: 'Show Loading Indicator',
        def: true
      },
      loadingText: {
        type: 'string',
        label: 'Loading Text',
        def: 'Загрузка...',
        if: {
          showLoadingIndicator: true
        }
      },
      buttonText: {
        type: 'string',
        label: 'Button Text',
        help: 'Используется если trigger = click',
        def: 'Загрузить контент',
        if: {
          trigger: 'click'
        }
      },
      className: {
        type: 'string',
        label: 'Custom CSS Class',
        help: 'Дополнительный CSS класс для стилизации'
      }
    }
  }
};
