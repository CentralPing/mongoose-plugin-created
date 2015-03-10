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

beforeAll(function (done) {
  connection = mongoose.createConnection('mongodb://localhost/unit_test');
  connection.once('connected', function () {
    done();
  });
});

afterAll(function (done) {
  connection.db.dropDatabase(function (err, result) {
    connection.close(function () {
      done();
    });
  });
});

describe('Mongoose plugin: created', function () {
  describe('with plugin declaration', function () {
    var schema;

    beforeEach(function () {
      schema = BlogSchema();
    });

    it('should add a virtual `created.date` to the schema', function () {
      schema.plugin(created);
      expect(schema.pathType('created.date')).toBe('virtual');
      expect(schema.pathType('created.by')).toBe('adhocOrUndefined');
    });

    it('should add both a virtual `created.by` and a real `created.date` to the schema', function () {
      schema.plugin(created, {byRef: 'User'});
      expect(schema.pathType('created.date')).toBe('virtual');
      expect(schema.pathType('created.by')).toBe('real');
    });

    it('should make `created.by` required by default', function () {
      schema.plugin(created, {byRef: 'User'});
      expect(schema.path('created.by').isRequired).toBe(true);
    });

    it('should add a real `created.date` to the schema', function () {
      schema.plugin(created, {useVirtual: false});
      expect(schema.pathType('created.date')).toBe('real');
      expect(schema.pathType('created.by')).toBe('adhocOrUndefined');
    });

    it('should add both `createdBy` and `createdDate` to the schema', function () {
      schema.plugin(created, {byRef: 'User', byPath: 'createdBy', datePath: 'createdDate'});
      expect(schema.pathType('createdDate')).toBe('virtual');
      expect(schema.pathType('createdBy')).toBe('real');
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

  describe('with document expirations', function () {
    var Blog;
    var originalTimeout;

    beforeAll(function () {
      // Need to extend the Jasmine timeout to allow for 60+ seconds
      // for MongoDB to purge the expired documents
      // http://docs.mongodb.org/manual/tutorial/expire-data/
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
    });

    afterAll(function () {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    it('should compile the model with the created plugin', function () {
      var schema = BlogSchema();
      schema.plugin(created, {expires: 5});
      Blog = model(schema);

      expect(Blog).toEqual(jasmine.any(Function));
    });

    it('should delete document after expiration', function (done) {
      Blog(blogData).save(function (err, blog) {
        setTimeout(function () {
          Blog.findById(blog._id, function (err, blog) {
            expect(err).toBe(null);
            expect(blog).toEqual(jasmine.any(Object));
          });
        }, 2500);

        setTimeout(function () {
          Blog.findById(blog._id, function (err, blog) {
            expect(err).toBe(null);
            expect(blog).toBe(null);

            done();
          });
        }, 100000);
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
    blog: String
  });
}
