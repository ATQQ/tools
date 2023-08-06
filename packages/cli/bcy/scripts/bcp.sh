branch=$(git branch --show-current);
echo "当前分支：$branch"; 
echo $branch | tr -d "\n" | pbcopy