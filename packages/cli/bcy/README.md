# bcy
quickly copy the branch name of the current project

## Usage

```sh
npx bcy

# or

npm i -g bcy
bcy
```

[Result](https://app.warp.dev/block/t2lXKscIeJ3rEfqMxrWadp)
```sh
bcy

当前分支：feature/bcy
```

## Principle

```sh
branch=$(git branch --show-current);
echo "当前分支：$branch"; 
echo $branch | tr -d "\n" | pbcopy
```

## Other
on Mac You can also use Shell

run the following script
```sh
echo "alias bcy='branch=\$(git branch --show-current); echo \"当前分支：\$branch\"; echo \$branch | tr -d \"\\\\n\" | pbcopy'" >> ~/.zshrc
```

then you can use `bcy` command