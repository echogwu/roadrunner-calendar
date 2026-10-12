export const languages = ['en', 'es', 'zh-CN'];

export const phrasebook = [
  ['Book delivery!','¡Entrega de libros!','图书发放！'], ['No school','No hay clases','不上课'],
  ['School closed','Escuela cerrada','学校停课'], ['Holiday','Día festivo','节假日'],
  ['Reading day','Día de lectura','阅读日'], ['Turn in reading calendar','Entregar el calendario de lectura','提交阅读日历'],
  ['Thanksgiving break','Vacaciones de Acción de Gracias','感恩节假期'], ['Winter break','Vacaciones de invierno','寒假'],
  ['Spring break','Vacaciones de primavera','春假'], ['Teacher work day','Día de trabajo de los maestros','教师工作日'],
  ['Parent-teacher conference','Conferencia de padres y maestros','家长教师会议']
];

const normalized = text => text.trim().toLocaleLowerCase().replace(/[!¡。！.]/g,'');

export function localTranslation(text, source, target) {
  const sourceIndex=languages.indexOf(source); const targetIndex=languages.indexOf(target);
  const row=phrasebook.find(item=>normalized(item[sourceIndex])===normalized(text));
  return row ? row[targetIndex] : '';
}

export function eventOccursOn(event, day) {
  return day >= event.start && day <= event.end;
}
