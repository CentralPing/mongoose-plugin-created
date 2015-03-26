var mongoose = require('mongoose');
var faker = require('faker');
var created = require('./created');
var Schema = mongoose.Schema;
var connection;

// Mongoose uses internal caching for models.
// While {cache: false} works with most models, models using references
// use the internal model cache for the reference.
// This removes the mongoose entirely from node's cache
delete require.cache.mongoose;

var blogData = {
  title: faker.lorem.sentence(),
  blog: faker.lorem.paragraphs()
};

beforeAll(function (done) {
  mongoose.set('debug', process.env.DEBUG || false);

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

    it('should add a virtual path for `created.date` and a path for `created.by` to the schema', function () {
      schema.plugin(created);
      expect(schema.pathType('created.date')).toBe('virtual');
      expect(schema.pathType('created.by')).toBe('real');
      expect(schema.path('created.by').instance).toBe('String');
    });

    it('should add a virtual path for `created.date` and a path reference for `created.by` to the schema', function () {
      schema.plugin(created, {by: {ref: 'User'}});
      expect(schema.pathType('created.date')).toBe('virtual');
      expect(schema.pathType('created.by')).toBe('real');
      expect(schema.path('created.by').instance).toBe('ObjectID');
    });

    it('should add a virtual path for `createdBy` and a path for `createdDate` to the schema', function () {
      schema.plugin(created, {by: {path: 'createdBy'}, date: {path: 'createdDate'}});
      expect(schema.pathType('createdDate')).toBe('virtual');
      expect(schema.pathType('createdBy')).toBe('real');
    });

    it('should only add a virtual path for `created.date` to the schema with `by.path` set to `null`', function () {
      schema.plugin(created, {by: {path: null}});
      expect(schema.pathType('created.date')).toBe('virtual');
      expect(schema.pathType('created.by')).toBe('adhocOrUndefined');
    });

    it('should only add a virtual path for `created.date` to the schema with `by.path` set to empty string', function () {
      schema.plugin(created, {by: {path: ''}});
      expect(schema.pathType('created.date')).toBe('virtual');
      expect(schema.pathType('created.by')).toBe('adhocOrUndefined');
    });

    it('should make `created.date` a path with `date.useVirtual` false', function () {
      schema.plugin(created, {date: {useVirtual: false}});
      expect(schema.pathType('created.date')).toBe('real');
    });

    it('should make `created.date` a path with options', function () {
      schema.plugin(created, {date: {options: {required: true}}});
      expect(schema.pathType('created.date')).toBe('real');
      expect(schema.path('created.date').isRequired).toBe(true);
    });

    it('should make `created.by` required with options', function () {
      schema.plugin(created, {by: {options: {required: true}}});
      expect(schema.path('created.by').isRequired).toBe(true);
    });

    it('should add  a virtual path`created.expires` with `date.options` setting an expiration', function () {
      schema.plugin(created, {date: {options: {expires: 1000}}});
      expect(schema.pathType('created.expires')).toBe('virtual');
    });

    it('should add a virtual path `expires` with `expire.path` set and `date.options` setting an expiration', function () {
      schema.plugin(created, {expires: {path: 'expires'}, date: {options: {expires: 1000}}});
      expect(schema.pathType('expires')).toBe('virtual');
    });

    it('should add a path `expires` with `expires.options` set and `date.options` setting an expiration', function () {
      schema.plugin(created, {expires: {options: {select: false}}, date: {options: {expires: 1000}}});
      expect(schema.pathType('created.expires')).toBe('real');
    });
  });

  describe('with documents', function () {
    var blog;

    beforeAll(function () {
      var Blog;
      var schema = BlogSchema();
      schema.plugin(created);

      Blog = model(schema);
      blog = new Blog();
    });

    it('should set `created.date` on instantiation', function () {
      expect(blog.created.date).toBeDefined();
    });

    it('should not update `created.date` on initial save', function (done) {
      var date = blog.created.date;

      blog.save(function (err, blog) {
        expect(blog.created.date).toEqual(date);
        done();
      });
    });

    it('should not update `created.date` on subsequent saves', function (done) {
      var date = blog.created.date;
      expect(blog.created.date).toBeDefined();

      blog.save(function (err, blog) {
        expect(blog.created.date).toEqual(date);
        done();
      });
    });
  });

  describe('with document expiration', function () {
    var Blog;

    beforeAll(function () {
      var schema = BlogSchema();
      schema.plugin(created, {date: {options: {expires: 1000}}});
      Blog = model(schema);
    });

    it('should populate `created.expires`', function () {
      var blog = Blog(blogData);

      expect(blog.created.expires - blog.created.date).toBe(1000);
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
