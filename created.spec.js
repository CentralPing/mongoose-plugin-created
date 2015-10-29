'use strict';
/* jshint node: true, mocha: true, expr: true */

var expect = require('chai').expect;
var mongoose = require('mongoose');
var faker = require('faker');
var created = require('./created');

var connectionString = 'mongodb://' +
  (process.env.MONGO_HOST || 'localhost') +
  (process.env.MONGO_PORT ? ':' + process.env.MONGO_PORT : '') +
  '/unit_test';

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

before(function (done) {
  mongoose.set('debug', process.env.DEBUG || false);

  connection = mongoose.createConnection(connectionString);
  connection.once('connected', function () {
    done();
  });
});

after(function (done) {
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
      schema = blogSchema();
    });

    it('should add a virtual path for `created.date` and a path for `created.by` to the schema', function () {
      schema.plugin(created);
      expect(schema.pathType('created.date')).to.equal('virtual');
      expect(schema.pathType('created.by')).to.equal('real');
      expect(schema.path('created.by').instance).to.equal('String');
    });

    it('should add a virtual path for `created.date` and a path reference for `created.by` to the schema', function () {
      schema.plugin(created, {by: {ref: 'User'}});
      expect(schema.pathType('created.date')).to.equal('virtual');
      expect(schema.pathType('created.by')).to.equal('real');
      expect(schema.path('created.by').instance).to.equal('ObjectID');
    });

    it('should add a virtual path for `createdBy` and a path for `createdDate` to the schema', function () {
      schema.plugin(created, {by: {path: 'createdBy'}, date: {path: 'createdDate'}});
      expect(schema.pathType('createdDate')).to.equal('virtual');
      expect(schema.pathType('createdBy')).to.equal('real');
    });

    it('should only add a virtual path for `created.date` to the schema with `by.path` set to `null`', function () {
      schema.plugin(created, {by: {path: null}});
      expect(schema.pathType('created.date')).to.equal('virtual');
      expect(schema.pathType('created.by')).to.equal('adhocOrUndefined');
    });

    it('should only add a virtual path for `created.date` to the schema with `by.path` set to empty string', function () {
      schema.plugin(created, {by: {path: ''}});
      expect(schema.pathType('created.date')).to.equal('virtual');
      expect(schema.pathType('created.by')).to.equal('adhocOrUndefined');
    });

    it('should add a path `created.date` with `date.useVirtual` false', function () {
      schema.plugin(created, {date: {useVirtual: false}});
      expect(schema.pathType('created.date')).to.equal('real');
      expect(schema.path('created.date').instance).to.equal('Date');
    });

    it('should add a path `created.date` with options while restricting type', function () {
      schema.plugin(created, {date: {options: {required: true, type: String}}});
      expect(schema.path('created.date').isRequired).to.be.true;
      expect(schema.path('created.date').instance).to.equal('Date');
    });

    it('should add a path `created.by` with options', function () {
      schema.plugin(created, {by: {options: {required: true}}});
      expect(schema.path('created.by').isRequired).to.be.true;
    });

    it('should add a path `created.expires` with `date.options` setting an expiration', function () {
      schema.plugin(created, {date: {options: {expires: 1000}}});
      expect(schema.pathType('created.expires')).to.equal('real');
      expect(schema.path('created.expires').instance).to.equal('Date');
    });

    it('should add a path `created.expires` with options while restricting type', function () {
      schema.plugin(created, {date: {options: {expires: 1000}}, expires: {options: {required: true, type: String}}});
      expect(schema.path('created.expires').isRequired).to.be.true;
      expect(schema.path('created.expires').instance).to.equal('Date');
    });

    it('should add a path `expires` with `expire.path` set and `date.options` setting an expiration', function () {
      schema.plugin(created, {expires: {path: 'expires'}, date: {options: {expires: 1000}}});
      expect(schema.pathType('expires')).to.equal('real');
    });

    it('should add a path `expires` with `expires.options` set and `date.options` setting an expiration', function () {
      schema.plugin(created, {expires: {options: {select: false}}, date: {options: {expires: 1000}}});
      expect(schema.pathType('created.expires')).to.equal('real');
    });
  });

  describe('with documents', function () {
    var blog;

    before(function () {
      var Blog;
      var schema = blogSchema();
      schema.plugin(created);

      Blog = model(schema);
      blog = new Blog();
    });

    it('should set `created.date` on instantiation', function () {
      expect(blog.created.date).to.be.defined;
    });

    it('should not update `created.date` on initial save', function (done) {
      var date = blog.created.date;

      blog.save(function (err, blog) {
        expect(blog.created.date).to.deep.equal(date);
        done();
      });
    });

    it('should not update `created.date` on subsequent saves', function (done) {
      var date = blog.created.date;
      expect(blog.created.date).to.be.defined;

      blog.save(function (err, blog) {
        expect(blog.created.date).to.deep.equal(date);
        done();
      });
    });
  });

  // http://mongoosejs.com/docs/api.html#schema_date_SchemaDate-expires
  describe('with document expiration', function () {
    var schema;

    beforeEach(function () {
      schema = blogSchema();
    });

    it('should populate `created.expires` with expiration set to a numeric value', function (done) {
      schema.plugin(created, {date: {options: {expires: 1000}}});
      var Blog = model(schema);
      var blog = new Blog(blogData);

      blog.save(function (err, blog) {
        expect(blog.created.expires - blog.created.date).to.equal(1000000);
        done();
      });
    });

    it('should populate `created.expires` with expiration set to a string value', function (done) {
      schema.plugin(created, {date: {options: {expires: '1h'}}});
      var Blog = model(schema);
      var blog = new Blog(blogData);

      blog.save(function (err, blog) {
        expect(blog.created.expires - blog.created.date).to.equal(3600000);
        done();
      });
    });

    it('should populate `created.expires` with expiration set to a Date value', function (done) {
      schema.plugin(created, {date: {options: {expires: new Date(Date.now() + 3600000)}}});
      var Blog = model(schema);
      var blog = new Blog(blogData);

      blog.save(function (err, blog) {
        expect(blog.created.expires - blog.created.date).to.be.at.least(3599900);
        expect(blog.created.expires - blog.created.date).to.be.at.most(3600100);
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

function blogSchema() {
  return new Schema({
    title: String,
    blog: String
  });
}
