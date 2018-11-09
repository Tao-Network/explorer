#!/bin/bash
step=4
for ((i=0;i<148;i=(i+step)));do
  count=`ps aux | grep "app.js" | grep -v "grep" | wc -l`
  if [ $count -lt 1 ]; then
    mv /var/www/etzBrowser/logs/out.log.txt /var/www/etzBrowser/logs/c_out.$(date -d "today" +"%Y%m%d_%H%M%S").txt
    mv /var/www/etzBrowser/logs/err.log.txt /var/www/etzBrowser/logs/c_err.$(date -d "today" +"%Y%m%d_%H%M%S").txt
    nohup node /var/www/etzBrowser/app.js 1>/var/www/etzBrowser/logs/out.log.txt 2>/var/www/etzBrowser/logs/err.log.txt &
    echo "start app ..."
  fi
  count_g=`ps aux | grep "grabber.js" | grep -v "grep" | wc -l`
  if [ $count_g -lt 1 ]; then
    mv /var/www/etzBrowser/tools/logs/out.log.txt /var/www/etzBrowser/tools/logs/c_out.$(date -d "today" +"%Y%m%d_%H%M%S").txt
    mv /var/www/etzBrowser/tools/logs/err.log.txt /var/www/etzBrowser/tools/logs/c_err.$(date -d "today" +"%Y%m%d_%H%M%S").txt
    nohup node /var/www/etzBrowser/tools/grabber.js 1>/var/www/etzBrowser/tools/logs/out.log.txt 2>/var/www/etzBrowser/tools/logs/err.log.txt &
    echo "start grabber ..."
  fi
  sleep $step
done
exit 0
