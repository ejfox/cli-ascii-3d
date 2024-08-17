# cli-ascii-3d

Transforming complex datasets into intuitive ASCII representations for enhanced pattern recognition and anomaly detection.

## Install

```
npm install -g cli-ascii-3d
```

## Use

```
cli-ascii-3d [options]

npx cli-ascii-3d [options]
```

Options:
- `-b, --boxes <1-10>` : Number of visualization nodes
- `-s, --speed <0.1-5.0>` : Animation speed multiplier

## Examples

### Standard:
```
cli-ascii-3d
```
> The default settings. Works for most situations.

### Intense:
```
cli-ascii-3d -b 8 -s 3.0
```
> Faster, more nodes. Use when things get... complicated.

### Subtle:
```
cli-ascii-3d -b 2 -s 0.5
```
> Slower, fewer nodes. For when you need to look closer.

### Extreme
```
cli-ascii-3d -b 20 -s 5.0
```
> Extremely fast, high degree of detail. Use with caution.

## Note

If it looks wrong, try:
```
TERM=xterm-256color cli-ascii-3d
```

We can't say why. You'll know when you need it.