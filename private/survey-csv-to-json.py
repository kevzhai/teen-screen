# convert the survey questions to a json document
import csv, json

num_sections = 0
sections = []
reader = csv.reader(open('./questions.csv', 'rb').read().splitlines())

curr_section = {'name': 'unknown name', 'questions': [], 'treshhold': 5}

for row in reader:
	if len(row) == 0:
		num_sections = num_sections + 1
		sections.append(curr_section)
		curr_section = {'name': 'unknown name', 'questions': [], 'treshhold': 5}
		continue
	else:
		curr_section['questions'].append({'num': row[0], 'text': row[1], 'type': row[2]})

dump = {'num_sections': num_sections, 'sections': sections}
json.dump(dump, open('survey-questions-temp.json', 'wb'))