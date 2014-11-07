var mongoose = require('mongoose');
var created = require('./created');
var Schema = mongoose.Schema;
var connection;

// Mongoose uses internal caching for models.
// While {cache: false} works with most models, models using references
// use the internal model cache for the reference.
// This removes the mongoose entirely from node's cache
delete require.cache.mongoose;

var blogData = {
  title: 'My first blog! #Super',
  blog: 'This is my very first #blog! I hope you enjoy it. #WOOHOO'
};

describe('Mongoose plugin: created', function () {
  it('should connect to test DB', function (done) {
    connection = mongoose.createConnection('mongodb://localhost/unit_test');
    connection.once('connected', function () {
      done();
    });
  });

  describe('with plugin declaration', function () {
    var schema;

    beforeEach(function () {
      schema = BlogSchema();
    });

    it('should add only `created.date` to the schema', function () {
      schema.plugin(created);
      expect(schema.path('created.by')).toBeUndefined();
      expect(schema.path('created.date')).toBeDefined();
    });

    it('should add both "created.by" and `created.date` to the schema', function () {
      schema.plugin(created, 'User');
      expect(schema.path('created.by')).toBeDefined();
      expect(schema.path('created.date')).toBeDefined();
    });

    it('should make "created.by" required by default', function () {
      schema.plugin(created, 'User');
      expect(schema.path('created.by').isRequired).toBe(true);
    });
  });

  describe('with initial document creation', function () {
    var blog;

    it('should compile the model and create a document with the created plugin', function () {
      var Blog;
      var schema = BlogSchema();
      schema.plugin(created);

      Blog = model(schema);
      expect(Blog).toEqual(jasmine.any(Function));

      blog = new Blog();
      expect(blog instanceof Blog).toBe(true);
    });

    it('should set `created.date`', function () {
      expect(blog.created.date).toBeDefined();
    });

    it('should not update `created.date` on initial save', function (done) {
      var date = blog.created.date;

      blog.save(function (err, blog) {
        expect(blog.created.date).toEqual(date);
        done();
      });
    });
  });

  describe('with document manipulations', function () {
    var Blog;

    it('should compile the model with the created plugin', function () {
      var schema = BlogSchema();
      schema.plugin(created);
      Blog = model(schema);

      expect(Blog).toEqual(jasmine.any(Function));
    });

    it('should not update `created.date` on subsequent saves', function (done) {
      Blog(blogData).save(function (err, blog) {
        var date = blog.created.date;

        expect(blog.created.date).toBeDefined();

        blog.blog = 'This is my sweet update! #foo #AhhhhYeah';

        blog.save(function (err, blog) {
          expect(blog.created.date).toEqual(date);
          done();
        });
      });
    });
  });

  it('should drop DB and disconnect', function (done) {
    connection.db.dropDatabase(function (err, result) {
      connection.close(function () {
        done();
      });
    });
  });
});

function model(name, schema) {
  if (arguments.length === 1) {
    schema = name;
    name = 'Model';
  }

  // Specifying a collection name allows the model to be overwritten in
  // Mongoose's model cache
  return connection.model(name, schema, name);
}

function BlogSchema() {
  return Schema({
    title: String,
    blog: String,
    created: {type: Date, 'default': Date.now}
  });
}
