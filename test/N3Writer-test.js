var N3Writer = require('../N3').Writer;
var chai = require('chai'),
    expect = chai.expect,
    util = require('util');
chai.should();

describe('N3Parser', function () {
  describe('The N3Writer module', function () {
    it('should be a function', function () {
      N3Writer.should.be.a('function');
    });

    it('should make N3Writer objects', function () {
      N3Writer().should.be.an.instanceof(N3Writer);
    });

    it('should be an N3Writer constructor', function () {
      new N3Writer().should.be.an.instanceof(N3Writer);
    });
  });

  describe('An N3Writer instance', function () {
    it('should serialize 0 triples',
      shouldSerialize([], ''));

    it('should serialize 1 triple',
      shouldSerialize([['abc', 'def', 'ghi']],
                      '<abc> <def> <ghi>.\n'));

    it('should serialize 2 triples',
      shouldSerialize([['abc', 'def', 'ghi'],
                       ['jkl', 'mno', 'pqr']],
                      '<abc> <def> <ghi>.\n' +
                      '<jkl> <mno> <pqr>.\n'));

    it('should serialize 3 triples',
      shouldSerialize([['abc', 'def', 'ghi'],
                       ['jkl', 'mno', 'pqr'],
                       ['stu', 'vwx', 'yz']],
                      '<abc> <def> <ghi>.\n' +
                      '<jkl> <mno> <pqr>.\n' +
                      '<stu> <vwx> <yz>.\n'));

    it('should serialize a literal',
      shouldSerialize([['a', 'b', '"cde"']],
                      '<a> <b> "cde".\n'));

    it('should serialize a literal with a type',
      shouldSerialize([['a', 'b', '"cde"^^<fgh>']],
                      '<a> <b> "cde"^^<fgh>.\n'));

    it('should serialize a literal with a language',
      shouldSerialize([['a', 'b', '"cde"@en-us']],
                      '<a> <b> "cde"@en-us.\n'));

    it('should serialize a literal containing a single quote',
      shouldSerialize([['a', 'b', '"c\'de"']],
                      '<a> <b> "c\'de".\n'));

    it('should serialize a literal containing a double quote',
      shouldSerialize([['a', 'b', '"c"de"']],
                      '<a> <b> "c\\"de".\n'));

    it('should serialize a literal containing a backspace',
      shouldSerialize([['a', 'b', '"c\\de"']],
                      '<a> <b> "c\\\\de".\n'));

    it('should serialize a literal containing a tab character',
      shouldSerialize([['a', 'b', '"c\tde"']],
                      '<a> <b> "c\\tde".\n'));

    it('should serialize a literal containing a newline character',
      shouldSerialize([['a', 'b', '"c\nde"']],
                      '<a> <b> "c\\nde".\n'));

    it('should serialize a literal containing a cariage return character',
      shouldSerialize([['a', 'b', '"c\rde"']],
                      '<a> <b> "c\\rde".\n'));

    it('should serialize a literal containing a backspace character',
      shouldSerialize([['a', 'b', '"c\bde"']],
                      '<a> <b> "c\\bde".\n'));

    it('should serialize a literal containing a form feed character',
      shouldSerialize([['a', 'b', '"c\fde"']],
                      '<a> <b> "c\\fde".\n'));

    it('should serialize blank nodes',
      shouldSerialize([['_:a', 'b', '_:c']],
                      '_:a <b> _:c.\n'));

    it('should not serialize a literal in the subject',
      shouldNotSerialize([['"a"', 'b', '"c']],
                          'A literal as subject is not allowed: "a"'));

    it('should not serialize a literal in the predicate',
      shouldNotSerialize([['a', '"b"', '"c']],
                          'A literal as predicate is not allowed: "b"'));

    it('should serialize valid prefixes',
      shouldSerialize({ a: 'http://a.org/',
                        b: 'http://a.org/b#',
                        c: 'http://a.org/b' },
                      [],
                      '@prefix a: <http://a.org/>.\n' +
                      '@prefix b: <http://a.org/b#>.\n\n'));

    it('should use prefixes when possible',
      shouldSerialize({ a: 'http://a.org/',
                        b: 'http://a.org/b#',
                        c: 'http://a.org/b' },
                      [['http://a.org/bc', 'http://a.org/b#ef', 'http://a.org/bhi'],
                       ['http://a.org/bc/de', 'http://a.org/b#e#f', 'http://a.org/b#x/t'],
                       ['http://a.org/3a', 'http://a.org/b#3a', 'http://a.org/b#a3']],
                      '@prefix a: <http://a.org/>.\n' +
                      '@prefix b: <http://a.org/b#>.\n\n' +
                      'a:bc b:ef a:bhi.\n' +
                      '<http://a.org/bc/de> <http://a.org/b#e#f> <http://a.org/b#x/t>.\n' +
                      '<http://a.org/3a> <http://a.org/b#3a> b:a3.\n'));

    it('should not repeat the same subjects',
      shouldSerialize([['abc', 'def', 'ghi'],
                       ['abc', 'mno', 'pqr'],
                       ['stu', 'vwx', 'yz']],
                      '<abc> <def> <ghi>;\n' +
                      '    <mno> <pqr>.\n' +
                      '<stu> <vwx> <yz>.\n'));

    it('should not repeat the same predicates',
      shouldSerialize([['abc', 'def', 'ghi'],
                       ['abc', 'def', 'pqr'],
                       ['abc', 'bef', 'ghi'],
                       ['abc', 'bef', 'pqr'],
                       ['stu', 'bef', 'yz']],
                      '<abc> <def> <ghi>, <pqr>;\n' +
                      '    <bef> <ghi>, <pqr>.\n' +
                      '<stu> <bef> <yz>.\n'));

    it('should write rdf:type as "a"',
      shouldSerialize([['abc', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'def']],
                      '<abc> a <def>.\n'));

    it('calls the done callback when ending the outputstream errors', function (done) {
      var writer = new N3Writer({
        write: function () {},
        end: function () { throw 'error'; },
      });
      writer.end(done);
    });

    it('sends output through end when no stream argument is given', function (done) {
      var writer = new N3Writer();
      writer.addTriple({ subject: 'a', predicate: 'b', object: 'c' });
      writer.end(function (error, output) {
        output.should.equal('<a> <b> <c>.\n');
        done(error);
      });
    });

    it('respects the prefixes argument when no stream argument is given', function (done) {
      var writer = new N3Writer({ a: 'b#' });
      writer.addTriple({ subject: 'b#a', predicate: 'b#b', object: 'b#c' });
      writer.end(function (error, output) {
        output.should.equal('@prefix a: <b#>.\n\na:a a:b a:c.\n');
        done(error);
      });
    });
  });
});

function shouldSerialize(prefixes, tripleArrays, expectedResult) {
  if (!expectedResult)
    expectedResult = tripleArrays, tripleArrays = prefixes, prefixes = null;
  return function (done) {
    var callback = this.callback,
        outputStream = new QuickStream(),
        writer = N3Writer(outputStream, prefixes);
    (function next() {
      var item = tripleArrays.shift();
      if (item)
        writer.addTriple({ subject: item[0], predicate: item[1], object: item[2] }, next);
      else
        writer.end(function (error) {
          try {
            outputStream.result.should.equal(expectedResult);
            done(error);
          }
          catch (e) {
            done(e);
          }
        });
    })();
  };
}

function shouldNotSerialize(tripleArrays, expectedMessage) {
  return function (done) {
    var outputStream = new QuickStream(),
        writer = N3Writer(outputStream),
        item = tripleArrays.shift();
    writer.addTriple({ subject: item[0], predicate: item[1], object: item[2] },
                      function (error) {
                        if (error) {
                          error.message.should.equal(expectedMessage);
                          done();
                        }
                      });
  };
}

function QuickStream() {
  var stream = {}, buffer = '';
  stream.write = function (chunk, encoding, callback) { buffer += chunk; callback && callback(); };
  stream.end = function (callback) { stream.result = buffer; buffer = null; callback(); };
  return stream;
}