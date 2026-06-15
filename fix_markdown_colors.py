import re

with open('src/components/MarkdownRenderer.tsx', 'r') as f:
    code = f.read()

# Fix the main wrapper
code = code.replace(
    'className={`prose prose-sm max-w-none text-slate-700 ${className}`}',
    'className={`prose prose-sm max-w-none text-slate-700 dark:text-slate-300 ${className}`}'
)

# Fix h1, h2, h3
code = code.replace(
    'className="text-2xl font-bold text-slate-900 mt-6 mb-4 pb-2 border-b border-slate-200"',
    'className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-6 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700"'
)
code = code.replace(
    'className="text-xl font-semibold text-slate-800 mt-5 mb-3"',
    'className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-5 mb-3"'
)
code = code.replace(
    'className="text-lg font-semibold text-slate-800 mt-4 mb-2"',
    'className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2"'
)

# Fix link
code = code.replace(
    'className="text-teal-600 hover:text-teal-800 font-semibold cursor-pointer border-b border-teal-200 hover:border-teal-600 transition-colors"',
    'className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-semibold cursor-pointer border-b border-teal-200 dark:border-teal-800 hover:border-teal-600 dark:hover:border-teal-500 transition-colors"'
)
code = code.replace(
    'className="text-blue-600 hover:text-blue-800 underline transition-colors"',
    'className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"'
)

# Fix img, table borders
code = code.replace(
    'className="max-w-full h-auto rounded-lg my-4 border border-slate-200 shadow-sm"',
    'className="max-w-full h-auto rounded-lg my-4 border border-slate-200 dark:border-slate-700 shadow-sm"'
)
code = code.replace(
    'className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm"',
    'className="overflow-x-auto my-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"'
)
code = code.replace(
    'className="min-w-full divide-y divide-slate-200"',
    'className="min-w-full divide-y divide-slate-200 dark:divide-slate-700"'
)
code = code.replace(
    'className="bg-slate-50"',
    'className="bg-slate-50 dark:bg-slate-800/50"'
)
code = code.replace(
    'className="bg-white divide-y divide-slate-200"',
    'className="bg-white dark:bg-slate-800/20 divide-y divide-slate-200 dark:divide-slate-700"'
)
code = code.replace(
    'className="hover:bg-slate-50 transition-colors"',
    'className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"'
)
code = code.replace(
    'className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"',
    'className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"'
)
code = code.replace(
    'className="px-4 py-3 text-sm text-slate-600 whitespace-pre-wrap"',
    'className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap"'
)

# Fix blockquote
code = code.replace(
    'className="border-l-4 border-slate-300 pl-4 py-1 italic text-slate-600 my-4 bg-slate-50 rounded-r"',
    'className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 py-1 italic text-slate-600 dark:text-slate-400 my-4 bg-slate-50 dark:bg-slate-800/50 rounded-r"'
)

# Fix code
code = code.replace(
    'className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-sm border border-slate-200"',
    'className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-sm border border-slate-200 dark:border-slate-700"'
)

# Fix alerts
code = code.replace('bg-blue-50 border-l-4 border-blue-500', 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500')
code = code.replace('text-blue-900', 'text-blue-900 dark:text-blue-100')
code = code.replace('text-blue-700', 'text-blue-700 dark:text-blue-400')

code = code.replace('bg-green-50 border-l-4 border-green-500', 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500')
code = code.replace('text-green-900', 'text-green-900 dark:text-green-100')
code = code.replace('text-green-700', 'text-green-700 dark:text-green-400')

code = code.replace('bg-purple-50 border-l-4 border-purple-500', 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500')
code = code.replace('text-purple-900', 'text-purple-900 dark:text-purple-100')
code = code.replace('text-purple-700', 'text-purple-700 dark:text-purple-400')

code = code.replace('bg-amber-50 border-l-4 border-amber-500', 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500')
code = code.replace('text-amber-900', 'text-amber-900 dark:text-amber-100')
code = code.replace('text-amber-700', 'text-amber-700 dark:text-amber-400')

code = code.replace('bg-red-50 border-l-4 border-red-500', 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500')
code = code.replace('text-red-900', 'text-red-900 dark:text-red-100')
code = code.replace('text-red-700', 'text-red-700 dark:text-red-400')

with open('src/components/MarkdownRenderer.tsx', 'w') as f:
    f.write(code)

