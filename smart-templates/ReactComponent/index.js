
module.exports = {

  name: 'React Component',

  directory: true,

  params: ['Name', 'Body', 'Content'],

  rules: function (config) {
    return ({
      items: [
          { destinationFile: 'index.html', sourceTemplateFile: 'index.template' },
          { destinationFile: '.', sourceContentFile: 'img/someimage.jpg' }
          // { destinationFile: 'images/someimage.jpg', sourceContentFile: 'img/someimage.jpg' }
      ]
    })
  }

}
