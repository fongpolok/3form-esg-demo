#!/bin/bash
set -e

# Render's free `type: web` plan requires an HTTP-speaking port, or its
# deploy-time port scan times out and kills the container — Private
# Services (which don't need this) aren't available on the free plan.
# MySQL doesn't speak HTTP, so this answers every connection on $PORT with
# a canned 200 purely to satisfy that scan; actual MySQL traffic is
# unaffected and still goes over 3306.
if [ -n "$PORT" ]; then
  printf 'HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok' > /tmp/health-response.http
  # -k keeps the listener up for repeated connections; -c re-execs the cat
  # per connection instead of streaming one shared stdin, which otherwise
  # only serves the first connection and hangs every one after it.
  nc -k -l "$PORT" -c 'cat /tmp/health-response.http' >/dev/null 2>&1 &
fi

exec docker-entrypoint.sh "$@"
