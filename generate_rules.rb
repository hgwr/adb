#!/usr/bin/env ruby
#
# easylist.txt のルールを分類・解析し、 css, selector, xpath を生成する。
#
# [, ! からはじまるコメント行の無視
# @@ からはじまる例外ルールの無視
#
# ^##                 CSS 化
# 
# ホスト指定つき ##   ホスト名から引ける Selector 辞書に追加
#                     ~で始まるホスト名は、例外指定する。
# 
# パス指定            href属性, src属性に contains な XPath 生成
#
#                     行頭、行末の * はとる
#                     行中の * は、複数の contains に分ける。
#                     | と || の処理をする。
#
#                     セパレータキャラクタ ^ は、 [^a-zA-Z0-9\-.%] と等価だが、 / と同じ扱いにする
#
# $ 以降のオプションは無視する。
#
# ひとつのルールに、オプションとして、サイト指定条件がぶら下がるようにする。
# 
# ~all.google.domains への対応

def regex_from_hosts(str)
  positive = []
  negative = []
  str.split(/ *, */).each do |host|
    if host =~ /^~/
      negative.push(host.sub(/^~/, '').gsub(/\./, '\\\\\\\\.'))
    else
      positive.push(host.gsub(/\./, '\\\\\\\\.'))
    end
  end
  [positive.join('|'), negative.join('|')]
end

def predicate(attr, value)
  value = value.sub(/^\*/, '').sub(/\*$/, '').gsub(/\^/, '/')
  value.split(/\*/).map do |part|
    if part =~ /^\|/
      f = 'starts-with'
      part = part.sub(/^\|/, '')
    else
      f = 'contains'
    end
    '%s(@%s, "%s")' % [f, attr, part]
  end.join(" and ")
end

def combined_predicate(attrs, value)
  attrs.map { |a| '(' + predicate(a, value) + ')' }.join(" or ")
end

def compose_xpath(tags, attrs, value)
  tags.map { |t| '//' + t + '[' + combined_predicate(attrs, value) + ']' }.join("|")
end

def default_xpath(line)
  compose_xpath(['a'], ['href'], line) # + '|' +
  # compose_xpath(['embed', 'iframe', 'img', 'object'], ['src'], line)
end

PATTERNS = {
  :comment => Regexp.compile('^[!\[].*'),
  :exception_rule => Regexp.compile('^@@'),
  :selector => Regexp.compile('^##(.+)'),
  :selector_with_host => Regexp.compile('^([^#]+?)##(.+)'),
  :line_head => Regexp.compile('^\|([^|].+)'),
  :both_https => Regexp.compile('^\|\|(.+)'),
}

def match(line)
  PATTERNS.keys.each do |key|
    m = PATTERNS[key].match(line)
    return [key, m] if m
  end
  [:other, nil]
end

def main
  selectors = []
  selectors_with_hosts = []
  xpaths = []
  (File::readlines("myfilter.txt") + File::readlines("easylist.txt")).each do |line|
    line = line.strip()
    line_type, m = match(line)
    case line_type
    when :comment, :exception_rule
      next
    when :selector
      selectors.push(m[1])
    when :selector_with_host
      selectors_with_hosts.push([regex_from_hosts(m[1]), m[2]])
    when :line_head, :other
      xpaths.push(default_xpath(line.sub(/\$.*$/, '')))
    when :both_https
      # || は、 |http:// に置き換える
      line = line.sub(/\$.*$/, '').sub(/^\|\|/, '|http://')
      xpaths.push(default_xpath(line.sub(/\$.*$/, '')))
    end
  end

  open('adb.css', 'w') do |f|
    selectors.each { |s| f.write("%s { display: none; }\n" % s) }
  end
  
  open('selectors_generated.js', 'w') do |f|
    f.write("var GENERATED_SELECTORS = [\n");
    f.fwrite(selectors_with_hosts.map do |host_regexps, selector|
               if host_regexps[0] == '' and host_regexps[1] == ''
                 "  [[], '%s']" % [selector]
               elsif host_regexps[0] == '' and host_regexps[1] != ''
                 "  [['.*', '%s'], '%s']" % [host_regexps[1], selector]
               elsif host_regexps[0] != '' and host_regexps[1] == ''
                 "  [['%s'], '%s']" % [host_regexps[0], selector]
               else
                 "  [['%s', '%s'], '%s']" % [host_regexps[0], host_regexps[1], selector]
               end
             end.join(",\n"))
    f.write("];\n")
  end

  open('xpaths_generated.js', 'w') do |f|
    f.write("var GENERATED_XPATHS = [\n");
    f.write(xpaths.map { |s| "  [[], '%s']" % s }.join(",\n"))
    f.write("];\n")
  end
end

main if $0 == __FILE__
