module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Offers',
    description: 'A widget to display offers',
    icon: 'question-circle'
  },
  fields: {
    add: {
      offers: {
        type: 'array',
        label: 'Offers',
        titleField: 'title',
        fields: {
          add: {
            title: {
              type: 'string',
              label: 'Title'
            },
            link: {
              type: 'url',
              label: 'Link'
            },
            description: {
              type: 'string',
              label: 'Description',
              textarea: true
            },
            details: {
              type: 'string',
              label: 'Details',
              textarea: true
            },
            ctaText: {
              type: 'string',
              label: 'Call to Action Text'
            },
            ctaLink: {
              type: 'url',
              label: 'Call to Action Link'
            },
            mobileId: {
              type: 'string',
              label: 'Mobile Id'
            }
          }
        }
      }
    }
  },
  methods(self) {
    return {
      renderList(offers) {
        return self.partial('offersList', { offers });
      }
    };
  },
  components(self) {
    return {
      renderList: {
        async output(req) {
          return {
            offers: await self.find(req).toArray()
          };
        }
      }
    };
  }
};
