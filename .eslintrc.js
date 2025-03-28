module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true
    },
    extends: 'airbnb-base',
    parserOptions: {
        ecmaVersion: 'latest'
    },
    rules: {
        'class-methods-use-this': 'off',
        'no-console': ['error', { allow: ['log', 'error', 'warn', 'info'] }],
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
        'no-underscore-dangle': 'off',
        'no-param-reassign': ['error', { props: false }],
        'indent': ['error', 4],
        'comma-dangle': ['error', 'never'],
        'max-len': ['error', { code: 120 }]
    }
}; 