#!/usr/bin/env ruby
require 'test/unit'
require 'generate_rules'

class TestGenerateRules < Test::Unit::TestCase
  def setup
  end

  def test_generate_regex_from_hosts
    assert_equal ['', ''], regex_from_hosts('')
    assert_equal ['', 'www\.foo\.com'], regex_from_hosts('~www.foo.com')
    assert_equal ['www\.foo\.com', ''], regex_from_hosts('www.foo.com')
    assert_equal ['www\.foo\.com|www\.bar\.com', ''], regex_from_hosts('www.foo.com, www.bar.com')
    assert_equal ['www\.bar\.com', 'www\.foo\.com'], regex_from_hosts('~www.foo.com, www.bar.com')
    assert_equal ['www\.222\.com|www\.444\.com', 'www\.111\.com|www\.333\.com'], regex_from_hosts('~www.111.com, www.222.com,~www.333.com,www.444.com')
  end

  def test_predicate
    assert_equal 'contains(@src, "abc/def/ghi")', predicate('src', 'abc^def^ghi')

    assert_equal 'contains(@src, "abc")', predicate('src', 'abc')
    assert_equal 'contains(@src, "abc")', predicate('src', 'abc*')
    assert_equal 'contains(@src, "abc")', predicate('src', '*abc')
    assert_equal 'contains(@src, "abc")', predicate('src', '*abc*')

    assert_equal 'contains(@src, "abc") and contains(@src, "def")', predicate('src', 'abc*def')
    assert_equal 'contains(@src, "abc") and contains(@src, "def")', predicate('src', '*abc*def')
    assert_equal 'contains(@src, "abc") and contains(@src, "def")', predicate('src', 'abc*def*')
    assert_equal 'contains(@src, "abc") and contains(@src, "def")', predicate('src', '*abc*def*')

    assert_equal 'contains(@src, "abc") and contains(@src, "def") and contains(@src, "ghi")', predicate('src', 'abc*def*ghi')

    assert_equal 'starts-with(@src, "abc")', predicate('src', '|abc')
    assert_equal 'starts-with(@src, "abc")', predicate('src', '|abc*')

    assert_equal 'starts-with(@src, "abc") and contains(@src, "def")', predicate('src', '|abc*def')
    assert_equal 'starts-with(@src, "abc") and contains(@src, "def")', predicate('src', '|abc*def*')
    assert_equal 'starts-with(@src, "abc") and contains(@src, "def") and contains(@src, "ghi")', predicate('src', '|abc*def*ghi')
    assert_equal 'starts-with(@src, "abc") and contains(@src, "def") and contains(@src, "ghi")', predicate('src', '|abc*def*ghi*')
  end

  def test_combine_predicate
    assert_equal '(contains(@src, "abc")) or (contains(@href, "abc"))', combined_predicate(['src', 'href'], 'abc')
  end

  def test_compose_xpath
    assert_equal '//a[(contains(@src, "abc")) or (contains(@href, "abc"))]|//img[(contains(@src, "abc")) or (contains(@href, "abc"))]', compose_xpath(['a', 'img'], ['src', 'href'],  'abc')
  end
end
