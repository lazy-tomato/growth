echo hello world!!
echo 请输入您下载文件的路径：

# 接受用户输入
read v_link

# 定义一个变量，存储 名称为 app-*.js 文件的文件名
v_app_name=`find $v_link -name 'app-*.js' | sed 's#.*/##'`

# 开始拷贝
cp $v_link/app.js ./1.js
cp $v_link/$v_app_name ./2.js

echo '>>> Successful'


