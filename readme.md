# connect-backbone-server
Connect middleware which provides a REST backend for a Backbone.js client

### Example
    var Backbone = require('backbone');
    Backbone.sync = require('backbone-stash')('data').sync;
    var Todo = Backbone.Model.extend({});
    var Todos = Backbone.Collection.extend({model: Todo});
    var collections = {todos: new Todos()};
    express_app.use(express.bodyParser());
    express_app.use(backboneServer(collections));

### To Do
- turn this into an npm package
- post to https://github.com/senchalabs/connect/wiki
