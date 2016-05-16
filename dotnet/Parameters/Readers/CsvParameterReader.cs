﻿using CloudBeat.Oxygen;
using CloudBeat.Oxygen.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CloudBeat.Oxygen.Parameters.Readers
{
	public class CsvParameterReader : IParameterReader
	{
		ParameterSourceSettings settings;
		public CsvParameterReader(ParameterSourceSettings settings)
		{
			this.settings = settings;
		}
		public IList<TestParameter> ReadAll()
		{
			if (settings.Format != ParameterSourceSettings.FormatType.CSV)
				throw new NotSupportedException("Unsupported source format: " + settings.Format.ToString());
			string content;
			if (!string.IsNullOrEmpty(settings.Content))
				content = settings.Content;
			else if (!string.IsNullOrEmpty(settings.FilePath))
				content = File.ReadAllText(settings.FilePath);
			else
				throw new ArgumentException("ParameterSourceSettings do not contain CSV file reference or content");
			
			var csvParamList = SeParser.ParseParameterizationCSV(content);
			List<TestParameter> testParamList = new List<TestParameter>();
			
			foreach (var csvParam in csvParamList)
			{
				var testParam = new TestParameter(csvParam.Name, csvParam.Parameters, settings);
				testParamList.Add(testParam);
			}

			return testParamList;
		}
	}
}