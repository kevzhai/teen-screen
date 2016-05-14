# convert the survey questions to a json document
import csv, json

num_sections = 0
sections = {}
section_names = []
reader = csv.DictReader(open('./questions.csv', 'rb').read().splitlines())

curr_section = {'name': 'unknown name', 'questions': [], 'treshhold': 5}

for row in reader:
	if not row['section'] in sections:
		section_names.append(row['section'])
		sections[row['section']] = {'threshold': 5, 'name': row['section'], 'questions': []}
	sections[row['section']]['questions'].append({'text': row['text'], 'num': row['num'], 'type': row['type']})

sections_to_output = []
for name in section_names:
	sections_to_output.append(sections[name])

dump = {'num_sections': len(sections_to_output), 'sections': sections_to_output}
json.dump(dump, open('survey-questions.json', 'wb'))